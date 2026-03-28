CREATE TABLE public.chat_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own chat usage"
  ON public.chat_usage FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own chat usage"
  ON public.chat_usage FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_chat_usage_user_type_time ON public.chat_usage (user_id, usage_type, created_at DESC);