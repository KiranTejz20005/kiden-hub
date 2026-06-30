import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

export function getSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";

  if (!authHeader.startsWith("Bearer ")) {
    return { client: null, user: null, error: new Error("Missing or invalid authorization header") };
  }

  const token = authHeader.replace("Bearer ", "");

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  return { client, user: null, error: null, token };
}

export async function getUser(req: Request) {
  const { client, token, error } = getSupabaseClient(req);
  if (error) return { user: null, error };

  try {
    const { data: { user }, error: authError } = await client.auth.getUser(token);
    if (authError) return { user: null, error: authError };
    return { user, error: null };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err : new Error("Authentication failed") };
  }
}

export function requireAuth(req: Request): Response | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}
