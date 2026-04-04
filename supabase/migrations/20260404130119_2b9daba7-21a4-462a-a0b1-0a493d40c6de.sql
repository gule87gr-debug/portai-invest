
DROP POLICY IF EXISTS "Users can update own messages" ON public.chat_messages;

ALTER TABLE public.chat_messages ADD CONSTRAINT valid_role CHECK (role IN ('user', 'assistant', 'system'));
