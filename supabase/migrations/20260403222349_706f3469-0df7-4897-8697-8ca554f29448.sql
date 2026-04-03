-- Fix 1: Remove client INSERT policies on usage tables (server-side only)
DROP POLICY IF EXISTS "Users can insert own usage" ON public.analysis_usage;
DROP POLICY IF EXISTS "Users can insert own chat usage" ON public.chat_usage;

-- Fix 2: Restrict chat_messages UPDATE to own sessions only
CREATE POLICY "Users can update own messages"
  ON public.chat_messages
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE chat_sessions.id = chat_messages.session_id
    AND chat_sessions.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE chat_sessions.id = chat_messages.session_id
    AND chat_sessions.user_id = auth.uid()
  ));