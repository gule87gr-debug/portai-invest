CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS public.admin_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email CITEXT NOT NULL UNIQUE,
  note TEXT NOT NULL DEFAULT '',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct client access to admin_emails select"
  ON public.admin_emails FOR SELECT TO authenticated USING (false);
CREATE POLICY "No direct client access to admin_emails insert"
  ON public.admin_emails FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No direct client access to admin_emails update"
  ON public.admin_emails FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No direct client access to admin_emails delete"
  ON public.admin_emails FOR DELETE TO authenticated USING (false);

CREATE TABLE IF NOT EXISTS public.admin_bypass_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email CITEXT NOT NULL,
  function_name TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_bypass_audit_created_at
  ON public.admin_bypass_audit (created_at DESC);

ALTER TABLE public.admin_bypass_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct client access to audit select"
  ON public.admin_bypass_audit FOR SELECT TO authenticated USING (false);
CREATE POLICY "No direct client access to audit insert"
  ON public.admin_bypass_audit FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No direct client access to audit update"
  ON public.admin_bypass_audit FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No direct client access to audit delete"
  ON public.admin_bypass_audit FOR DELETE TO authenticated USING (false);

INSERT INTO public.admin_emails (email, note)
VALUES ('gule.87.gr@gmail.com', 'Seed: initial admin')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin_email(_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails WHERE email = _email::CITEXT
  );
$$;

CREATE OR REPLACE FUNCTION public.log_admin_bypass(_email TEXT, _function_name TEXT, _user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_bypass_audit (email, function_name, user_id)
  VALUES (_email::CITEXT, _function_name, _user_id);
END;
$$;