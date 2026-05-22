
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS pro_trial_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS trial_end_date timestamptz,
  ADD COLUMN IF NOT EXISTS trial_used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pro_tour_completed boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.trial_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  action text NOT NULL,
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trial_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trial audit"
  ON public.trial_audit_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "No direct client insert on trial audit"
  ON public.trial_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "No direct client update on trial audit"
  ON public.trial_audit_log FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "No direct client delete on trial audit"
  ON public.trial_audit_log FOR DELETE
  TO authenticated
  USING (false);

CREATE INDEX IF NOT EXISTS trial_audit_log_user_id_idx ON public.trial_audit_log(user_id);
