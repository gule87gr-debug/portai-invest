ALTER TABLE public.payment_consents
  DROP CONSTRAINT IF EXISTS payment_consents_consent_type_check;
ALTER TABLE public.payment_consents
  ADD CONSTRAINT payment_consents_consent_type_check
  CHECK (consent_type IN (
    'checkout_terms',
    'eu_withdrawal_waiver',
    'no_waiver_acknowledged',
    'cancel_no_refund_acknowledged',
    'reactivate',
    'eu_withdrawal_exercised'
  ));