
CREATE TABLE IF NOT EXISTS public.payment_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('checkout_terms', 'eu_withdrawal_waiver', 'no_waiver_acknowledged', 'cancel_no_refund_acknowledged', 'reactivate')),
  tier TEXT,
  price_id TEXT,
  consent_text TEXT NOT NULL,
  consent_version TEXT NOT NULL DEFAULT 'v1',
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_consents_user ON public.payment_consents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_consents_type ON public.payment_consents(consent_type, created_at DESC);

ALTER TABLE public.payment_consents ENABLE ROW LEVEL SECURITY;

-- Users can view their own consent records (for transparency/GDPR access)
CREATE POLICY "Users can view their own payment consents"
ON public.payment_consents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- No client-side INSERT/UPDATE/DELETE — only Edge Functions (service role) write here.
-- This guarantees the consent record is genuine and tamper-resistant.

-- Immutability: once recorded, a consent can never be modified or deleted (audit log).
CREATE POLICY "No updates to payment consents"
ON public.payment_consents FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No deletes of payment consents"
ON public.payment_consents FOR DELETE
TO authenticated
USING (false);
