-- Private relations have no browser grants. Public RPCs are the only API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  alias text not null default ('Little star ' || substr(replace(gen_random_uuid()::text,'-',''),1,12)),
  terms_accepted_at timestamptz not null default now(),
  privacy_accepted_at timestamptz not null default now(),
  legal_version text not null,
  created_at timestamptz not null default now(),
  suspended boolean not null default false,
  last_post_at timestamptz
);
create table private.admins (user_id uuid primary key references auth.users(id) on delete cascade);
create table private.posts (
  id bigint generated always as identity primary key,
  public_token uuid unique not null default gen_random_uuid(),
  owner_id uuid not null references private.accounts(id) on delete cascade,
  emojis text[] not null check (cardinality(emojis)=3),
  body text not null check (length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  flagged boolean not null,
  reasons text[] not null,
  severity text not null check (severity in ('none','medium','high')),
  hidden boolean not null default false
);
create table private.reports (
  id uuid primary key default gen_random_uuid(),
  post_id bigint not null references private.posts(id) on delete cascade,
  reporter_id uuid not null references private.accounts(id) on delete cascade,
  reason text not null check(length(btrim(reason)) between 1 and 500),
  status text not null default 'open' check(status in ('open','reviewed')),
  created_at timestamptz not null default now(),
  unique(post_id,reporter_id)
);
create table private.audit (
  id bigint generated always as identity primary key,
  actor uuid not null, action text not null, target text not null,
  created_at timestamptz not null default now()
);
create table private.settings (
  singleton boolean primary key default true check(singleton),
  maintenance boolean not null default false,
  posting_enabled boolean not null default true,
  announcement text not null default '' check(length(announcement)<=500)
);
insert into private.settings(singleton) values(true);
alter table private.accounts enable row level security;
alter table private.admins enable row level security;
alter table private.posts enable row level security;
alter table private.reports enable row level security;
alter table private.audit enable row level security;
alter table private.settings enable row level security;
revoke all on all tables in schema private from public,anon,authenticated;
revoke all on all sequences in schema private from public,anon,authenticated;

create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from private.admins where user_id=auth.uid());
$$;
create function private.require_member(p_posting boolean default false) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from auth.identities where user_id=auth.uid() and provider='google') then raise exception 'Google account required' using errcode='42501'; end if;
 if not exists(select 1 from private.accounts where id=auth.uid() and legal_version='2026-10-22-draft') then raise exception 'Agreement required' using errcode='42501'; end if;
 if exists(select 1 from private.settings where maintenance) and not private.is_admin() then raise exception 'Maintenance' using errcode='42501'; end if;
 if p_posting and (exists(select 1 from private.accounts where id=auth.uid() and suspended) or exists(select 1 from private.settings where not posting_enabled)) then raise exception 'Posting paused' using errcode='42501'; end if;
end $$;
create function private.require_admin() returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_member();
 if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
end $$;

create function public.account_access() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('accepted',exists(select 1 from private.accounts a where a.id=auth.uid() and a.legal_version='2026-10-22-draft') and exists(select 1 from auth.identities where user_id=auth.uid() and provider='google'),'admin',private.is_admin(),'suspended',coalesce((select suspended from private.accounts where id=auth.uid()),false));
$$;
create function public.accept_legal(p_version text,p_agreed boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_agreed is distinct from true or p_version is distinct from '2026-10-22-draft' or auth.uid() is null or not exists(select 1 from auth.identities where user_id=auth.uid() and provider='google') then raise exception 'Agreement and Google account required' using errcode='42501'; end if;
 insert into private.accounts(id,legal_version) values(auth.uid(),p_version)
 on conflict(id) do update set legal_version=excluded.legal_version,terms_accepted_at=now(),privacy_accepted_at=now();
end $$;
create function public.site_status() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('maintenance',maintenance,'posting_enabled',posting_enabled,'announcement',announcement) from private.settings;
$$;
create function public.community_feed() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_member();
 return coalesce((select jsonb_agg(x.item order by x.created_at desc) from (
 select p.created_at,jsonb_build_object('token',p.public_token,'alias',a.alias,'emojis',p.emojis,'day',to_char(p.created_at at time zone 'UTC','YYYY-MM-DD'),'text',case when p.flagged then null else p.body end,'flagged',p.flagged,'severity',p.severity,'mine',p.owner_id=auth.uid()) item
 from private.posts p join private.accounts a on a.id=p.owner_id where not p.hidden order by p.created_at desc limit 100) x),'[]'::jsonb);
end $$;
create function public.reveal_post(p_token uuid) returns text language plpgsql stable security definer set search_path='' as $$
begin
 perform private.require_member();
 return (select body from private.posts where public_token=p_token and not hidden);
end $$;
create function public.report_post(p_token uuid,p_reason text) returns void language plpgsql security definer set search_path='' as $$
declare target bigint;
begin
 perform private.require_member(true);
 select id into target from private.posts where public_token=p_token and not hidden;
 if target is null then raise exception 'Post unavailable'; end if;
 if (select count(*) from private.reports where reporter_id=auth.uid() and created_at>now()-interval '1 hour')>=20 then raise exception 'Report rate limit'; end if;
 insert into private.reports(post_id,reporter_id,reason) values(target,auth.uid(),p_reason) on conflict(post_id,reporter_id) do nothing;
end $$;
create function public.delete_own_post(p_token uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 -- A suspended user may still remove their shared content.
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 delete from private.posts where public_token=p_token and owner_id=auth.uid();
end $$;

-- Only the trusted Edge Function can call this mutation; the caller is derived
-- from a verified Google session, never from an untrusted request body.
create function public.publish_moderated(p_owner uuid,p_emojis text[],p_text text,p_flagged boolean,p_reasons text[],p_severity text) returns uuid language plpgsql security definer set search_path='' as $$
declare token uuid;
begin
 if not exists(select 1 from auth.identities where user_id=p_owner and provider='google') then raise exception 'Google required'; end if;
 perform 1 from private.accounts where id=p_owner for update;
 if not found or not exists(select 1 from private.accounts where id=p_owner and not suspended and legal_version='2026-10-22-draft') then raise exception 'Account unavailable'; end if;
 if exists(select 1 from private.settings where maintenance or not posting_enabled) then raise exception 'Posting paused'; end if;
 if exists(select 1 from private.accounts where id=p_owner and last_post_at>now()-interval '24 hours') then raise exception 'One post per 24 hours'; end if;
 if p_flagged is null or p_severity is null or p_reasons is null or p_flagged<>(p_severity<>'none') then raise exception 'Moderation required'; end if;
 insert into private.posts(owner_id,emojis,body,flagged,reasons,severity) values(p_owner,p_emojis,btrim(p_text),p_flagged,p_reasons,p_severity) returning public_token into token;
 update private.accounts set last_post_at=now() where id=p_owner;
 return token;
end $$;

create function public.admin_snapshot(p_search text default '') returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_admin();
 if length(p_search)>100 then raise exception 'Search too long'; end if;
 select jsonb_build_object(
 'users',coalesce((select jsonb_agg(to_jsonb(u)) from (select a.id,au.email,a.created_at,a.suspended,(select count(*) from private.posts where owner_id=a.id) post_count,(select count(*) from private.reports r join private.posts p on p.id=r.post_id where p.owner_id=a.id) report_count from private.accounts a join auth.users au on au.id=a.id where p_search='' or au.email ilike '%'||p_search||'%' or a.id::text=p_search or a.alias ilike '%'||p_search||'%' order by a.created_at desc limit 100) u),'[]'::jsonb),
 'posts',coalesce((select jsonb_agg(to_jsonb(p)) from (select p.public_token token,p.owner_id owner,p.body text,p.emojis,p.hidden,p.flagged,p.severity from private.posts p join private.accounts a on a.id=p.owner_id join auth.users au on au.id=a.id where p_search='' or au.email ilike '%'||p_search||'%' or a.id::text=p_search or a.alias ilike '%'||p_search||'%' order by p.created_at desc limit 100) p),'[]'::jsonb),
 'reports',coalesce((select jsonb_agg(to_jsonb(r)) from (select r.id,p.public_token post_token,r.reason,r.status,p.body text,p.emojis,p.flagged,p.hidden from private.reports r join private.posts p on p.id=r.post_id order by r.created_at desc limit 100) r),'[]'::jsonb),
 'audit',coalesce((select jsonb_agg(to_jsonb(l)) from (select actor,action,target,created_at from private.audit order by id desc limit 100) l),'[]'::jsonb),
 'settings',public.site_status()) into result;
 return result;
end $$;
create function public.admin_action(p_action text,p_target text,p_payload jsonb default '{}') returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_admin();
 case p_action
 when 'hide','unhide' then update private.posts set hidden=(p_action='hide') where public_token=p_target::uuid;
 when 'remove_post' then delete from private.posts where public_token=p_target::uuid;
 when 'suspend','unsuspend' then update private.accounts set suspended=(p_action='suspend') where id=p_target::uuid;
 when 'cleanup_user' then
   delete from private.reports where reporter_id=p_target::uuid;
   delete from private.posts where owner_id=p_target::uuid;
 when 'review_report' then update private.reports set status='reviewed' where id=p_target::uuid;
 when 'settings' then update private.settings set maintenance=(p_payload->>'maintenance')::boolean,posting_enabled=(p_payload->>'posting_enabled')::boolean,announcement=p_payload->>'announcement';
 else raise exception 'Unknown action';
 end case;
 insert into private.audit(actor,action,target) values(auth.uid(),p_action,p_target);
end $$;

-- Deny PostgreSQL's implicit PUBLIC execute grants and Supabase defaults.
revoke all on all functions in schema private from public,anon,authenticated;
revoke all on function public.account_access(),public.accept_legal(text,boolean),public.site_status(),public.community_feed(),public.reveal_post(uuid),public.report_post(uuid,text),public.delete_own_post(uuid),public.admin_snapshot(text),public.admin_action(text,text,jsonb),public.publish_moderated(uuid,text[],text,boolean,text[],text) from public,anon,authenticated;
grant execute on function public.account_access(),public.accept_legal(text,boolean),public.site_status(),public.community_feed(),public.reveal_post(uuid),public.report_post(uuid,text),public.delete_own_post(uuid),public.admin_snapshot(text),public.admin_action(text,text,jsonb) to authenticated;
grant execute on function public.publish_moderated(uuid,text[],text,boolean,text[],text) to service_role;
