import { createClient } from "@supabase/supabase-js";
import { moderate } from "../../../web/src/moderation/moderation.ts";
import { allEmojis } from "../../../web/src/data/emojis.ts";
const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((x) => x.trim());
Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  const cors = {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "null",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  if (origin && !allowed.includes(origin))
    return reply(403, { error: "Origin not allowed" });
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST")
    return reply(405, { error: "Method not allowed" });
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 16000)
      return reply(413, { error: "Request too large" });
    const url = Deno.env.get("SUPABASE_URL")!;
    const auth = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!);
    const bearer = request.headers
      .get("Authorization")
      ?.replace(/^Bearer\s+/i, "");
    if (!bearer) return reply(401, { error: "Sign in required" });
    const { data, error } = await auth.auth.getUser(bearer);
    if (error || !data.user) return reply(401, { error: "Sign in required" });
    // Streaming bound works even for chunked requests with no Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return reply(400, { error: "Body required" });
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 16000) {
        await reader.cancel();
        return reply(413, { error: "Request too large" });
      }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const body = JSON.parse(new TextDecoder().decode(bytes));
    if (
      typeof body.text !== "string" ||
      !body.text.trim() ||
      body.text.length > 1000 ||
      !Array.isArray(body.emojis) ||
      body.emojis.length !== 3 ||
      !body.emojis.every(
        (x: unknown) => typeof x === "string" && allEmojis.includes(x),
      )
    )
      return reply(400, { error: "Choose three emojis and a short story" });
    const result = moderate(body.text);
    const service = createClient(
      url,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const saved = await service.rpc("publish_moderated", {
      p_owner: data.user.id,
      p_emojis: body.emojis,
      p_text: body.text,
      p_flagged: result.flagged,
      p_reasons: result.reasons,
      p_severity: result.severity,
    });
    if (saved.error)
      return reply(403, {
        error: "Posting unavailable or daily allowance used",
      });
    return reply(200, { ok: true });
  } catch {
    return reply(400, { error: "Could not publish this moment" });
  }
});
