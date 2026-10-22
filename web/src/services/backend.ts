import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
// Do not initialize with placeholders or privileged legacy service-role JWTs.
function safeKey(value: string | undefined) {
  if (!value || value.includes("REPLACE")) return false;
  if (value.startsWith("sb_publishable_")) return true;
  try {
    return JSON.parse(atob(value.split(".")[1])).role === "anon";
  } catch {
    return false;
  }
}
export const backend =
  url && /^https:\/\//.test(url) && !url.includes("YOUR_") && safeKey(key)
    ? createClient(url, key!, {
        auth: {
          flowType: "pkce",
          detectSessionInUrl: false,
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

export function callbackUrl(
  origin = window.location.origin,
  base = import.meta.env.BASE_URL,
) {
  return new URL(base, origin).href;
}
export async function rpc<T>(name: string, args = {}): Promise<T> {
  if (!backend) throw new Error("Backend is not configured.");
  const { data, error } = await backend.rpc(name, args);
  if (error)
    throw new Error(
      "The request could not be completed. Please retry or contact the team.",
    );
  return data as T;
}
