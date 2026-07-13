import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { ok: false, error: "SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt." },
      { status: 500, headers: corsHeaders },
    );
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await client.rpc("apply_income_for_all");

  if (error) {
    return Response.json(
      { ok: false, error: error.message },
      { status: 500, headers: corsHeaders },
    );
  }

  return Response.json(
    {
      ok: true,
      updatedAt: new Date().toISOString(),
      teams: data,
    },
    { headers: corsHeaders },
  );
});
