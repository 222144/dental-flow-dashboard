import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "init";

    if (action === "init") {
      // Random doctor + all patients in clinic
      const { data: doctors } = await admin.from("doctors").select("*");
      const { data: patients } = await admin
        .from("patients")
        .select("id, patient_number, full_name, age, gender, phone, last_visit, status, chronic_diseases")
        .order("created_at", { ascending: false });

      const doctor = doctors && doctors.length > 0
        ? doctors[Math.floor(Math.random() * doctors.length)]
        : null;

      return json({ doctor, patients: patients ?? [] });
    }

    if (action === "patient") {
      const patientId = body.patient_id as string;
      if (!patientId) return json({ error: "patient_id required" }, 400);

      const [
        { data: patient },
        { data: appointments },
        { data: invoices },
        { data: teeth },
      ] = await Promise.all([
        admin.from("patients").select("*").eq("id", patientId).maybeSingle(),
        admin.from("appointments").select("*").eq("patient_id", patientId).order("scheduled_at", { ascending: false }),
        admin.from("patient_invoices").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
        admin.from("tooth_records").select("*").eq("patient_id", patientId),
      ]);

      return json({
        patient,
        appointments: appointments ?? [],
        invoices: invoices ?? [],
        teeth: teeth ?? [],
      });
    }

    if (action === "save_tooth") {
      const { patient_id, tooth_number, condition, notes } = body;
      if (!patient_id || typeof tooth_number !== "number") {
        return json({ error: "patient_id and tooth_number required" }, 400);
      }

      const { data, error } = await admin
        .from("tooth_records")
        .upsert(
          {
            patient_id,
            tooth_number,
            condition: condition ?? "",
            notes: notes ?? "",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "patient_id,tooth_number" },
        )
        .select()
        .single();

      if (error) throw error;
      return json({ tooth: data });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
