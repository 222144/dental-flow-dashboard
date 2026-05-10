import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: patients, error } = await admin.from("patients").select("*");
    if (error) throw error;
    if (!patients || patients.length === 0) {
      return new Response(JSON.stringify({ patient: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const patient = patients[Math.floor(Math.random() * patients.length)];

    const [{ data: invoices }, { data: appointments }] = await Promise.all([
      admin.from("patient_invoices").select("*").eq("patient_id", patient.id).order("created_at", { ascending: false }),
      admin.from("appointments").select("*").eq("patient_id", patient.id).order("scheduled_at", { ascending: true }),
    ]);

    return new Response(
      JSON.stringify({ patient, invoices: invoices ?? [], appointments: appointments ?? [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
