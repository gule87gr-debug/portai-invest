
-- Fix 1: Add expires_at column to email_unsubscribe_tokens
ALTER TABLE public.email_unsubscribe_tokens
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days');

-- Fix 2: Explicit deny INSERT policy on analysis_usage for authenticated users
CREATE POLICY "No direct user inserts"
  ON public.analysis_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Fix 3: Explicit deny INSERT policy on chat_usage for authenticated users  
CREATE POLICY "No direct user inserts"
  ON public.chat_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (false);
