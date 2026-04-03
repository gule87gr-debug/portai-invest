CREATE POLICY "Users can insert own chat usage"
  ON public.chat_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);