-- Tooth records (odontogram) per patient
CREATE TABLE public.tooth_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  tooth_number INT NOT NULL,
  condition TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (patient_id, tooth_number)
);

ALTER TABLE public.tooth_records ENABLE ROW LEVEL SECURITY;

-- Patient can view their own tooth records
CREATE POLICY "Patient views own tooth records"
ON public.tooth_records FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.patients p
  WHERE p.id = tooth_records.patient_id AND p.account_user_id = auth.uid()
));

-- Patient owner (clinic admin who created patient) manages tooth records
CREATE POLICY "Clinic owner manages tooth records"
ON public.tooth_records FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.patients p
  WHERE p.id = tooth_records.patient_id AND p.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.patients p
  WHERE p.id = tooth_records.patient_id AND p.user_id = auth.uid()
));

CREATE TRIGGER update_tooth_records_updated_at
BEFORE UPDATE ON public.tooth_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tooth_records_patient ON public.tooth_records(patient_id);