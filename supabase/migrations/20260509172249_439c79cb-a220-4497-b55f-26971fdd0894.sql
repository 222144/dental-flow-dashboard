
-- 1) Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'patient');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) Link patients to login accounts
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS account_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS patients_account_user_id_idx
  ON public.patients(account_user_id);

-- Allow patient to view their own row
CREATE POLICY "Patient can view own profile"
  ON public.patients FOR SELECT TO authenticated
  USING (account_user_id = auth.uid());

-- Allow patient to view their own invoices
CREATE POLICY "Patient can view own invoices"
  ON public.patient_invoices FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_invoices.patient_id
        AND p.account_user_id = auth.uid()
    )
  );

-- 3) Appointments
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_name text NOT NULL DEFAULT '',
  doctor_specialty text NOT NULL DEFAULT '',
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  diagnosis text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX appointments_patient_idx ON public.appointments(patient_id);
CREATE INDEX appointments_scheduled_idx ON public.appointments(scheduled_at);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Owner (admin user who created) can manage
CREATE POLICY "Owner manages appointments"
  ON public.appointments FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins manage all appointments
CREATE POLICY "Admins manage all appointments"
  ON public.appointments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Patient can view their own appointments
CREATE POLICY "Patient views own appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = appointments.patient_id
        AND p.account_user_id = auth.uid()
    )
  );

-- updated_at trigger (reuse existing function if present)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER appointments_set_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
