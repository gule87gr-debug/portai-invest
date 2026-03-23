
CREATE TABLE public.analysis_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  used_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analysis_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.analysis_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.analysis_usage
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_analysis_usage_user_date ON public.analysis_usage(user_id, used_date);
