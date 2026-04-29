CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT NOT NULL DEFAULT 'ذكر',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  chronic_diseases TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'نشط',
  last_visit DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, patient_number)
);

CREATE TABLE public.patient_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT 'رسوم فتح ملف مريض',
  amount NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'cash',
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, invoice_number)
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patients"
ON public.patients
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients"
ON public.patients
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own patient invoices"
ON public.patient_invoices
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own patient invoices"
ON public.patient_invoices
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.patients p
    WHERE p.id = patient_invoices.patient_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own patient invoices"
ON public.patient_invoices
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.patients p
    WHERE p.id = patient_invoices.patient_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own patient invoices"
ON public.patient_invoices
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_patients_full_name ON public.patients(full_name);
CREATE INDEX idx_patient_invoices_user_id ON public.patient_invoices(user_id);
CREATE INDEX idx_patient_invoices_patient_id ON public.patient_invoices(patient_id);
CREATE INDEX idx_patient_invoices_payment_status ON public.patient_invoices(payment_status);

CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_invoices_updated_at
BEFORE UPDATE ON public.patient_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();