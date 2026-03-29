
-- Drop client-side INSERT policies on usage tables (now handled by service_role in edge functions)
DROP POLICY IF EXISTS "Users can insert own usage" ON public.analysis_usage;
DROP POLICY IF EXISTS "Users can insert own chat usage" ON public.chat_usage;

-- Add missing DELETE policy on user_settings
CREATE POLICY "Users can delete own settings"
  ON public.user_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
