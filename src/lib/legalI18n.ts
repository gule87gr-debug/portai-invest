// Multilingual legal copy for EU consumer-rights flows.
// Covers Billing Consents page + Terms of Service §9 (Subscription, Payments
// and Right of Withdrawal). Spanish + English are the primary EU jurisdictions
// we operate in (PortAI is established in Spain). Other supported app
// languages fall back to English so the legal meaning is never lost in a
// loose machine translation we haven't reviewed.
//
// IMPORTANT: never auto-translate this file with a generic LLM. Each string
// here corresponds to a specific article of EU/Spanish law and the wording
// has been chosen to match the official terminology of those statutes.

import type { Language } from "@/contexts/LanguageContext";

type ConsentTone = "default" | "secondary" | "destructive" | "outline";

export type LegalConsentMeta = {
  label: string;
  tone: ConsentTone;
  proves: string;
  legalBasis: string;
};

export type LegalCopy = {
  // ── Billing Consents page ──────────────────────────────────────────
  page: {
    title: string;
    subtitle: string;
    backToSettings: string;
    export: string;
    signInRequired: string;
    loading: string;
    noRecordsTitle: string;
    noRecordsBody: string;
    recordIdLabel: string; // "Record ID:"
    recordIdSuffix: string; // "Stored permanently and cannot be modified."
  };
  explainer: {
    title: string;
    intro: string; // before the bullet list
    bullets: { strong: string; rest: string }[];
    immutableStrong: string;
    immutableRest: string;
  };
  withdrawal: {
    eligibleTitle: string;
    eligibleBodyPrefix: string; // "You purchased on {date} and did not waive..."
    eligibleBodyMiddle: string; // " You may cancel this purchase ... until "
    eligibleBodySuffix: string; // "."
    submitCta: string;
    alreadyOnFile: string;
    modalTitle: string;
    modalIntro: string;
    optionalReasonLabel: string;
    optionalReasonPlaceholder: string;
    whatHappensNext: string;
    happens: string[]; // bullet list
    cancelBtn: string;
    submitBtn: string;
  };
  card: {
    provesHeading: string;
    legalBasisLabel: string;
    exactTextHeading: string;
    immutableHeading: string;
    ipLabel: string;
    priceIdLabel: string;
    userAgentLabel: string;
    metadataLabel: string;
  };
  consentLabels: Record<string, LegalConsentMeta>;

  // ── Terms of Service §9 (Subscription, Payments & Withdrawal) ──────
  tos: {
    sectionTitle: string;
    subscriptionStrong: string;
    subscriptionIntro: string;
    subscriptionBullets: string[];
    cancellingStrong: string;
    cancellingBody: string;
    planChangesStrong: string;
    planChangesBody: string;
    withdrawalStrong: string;
    // Body uses inline JSX for an email link, so we split around it.
    withdrawalBodyBefore: string; // "...send an email to "
    withdrawalEmailLabel: string; // shown as link text
    withdrawalBodyAfter: string;
    partialUseEm: string;
    partialUseBody: string;
    refundStrong: string;
    refundBody: string;
    priceChangeStrong: string;
    priceChangeBody: string;
    failedPaymentStrong: string;
    failedPaymentBody: string;
  };
};

// Fallback / canonical English source of truth.
const en: LegalCopy = {
  page: {
    title: "My Billing Consents",
    subtitle:
      "A tamper-resistant record of every payment, waiver, and cancellation acknowledgement you've given. These records are immutable — kept as legal proof of your informed consent (Directive 2011/83/EU).",
    backToSettings: "Back to Settings",
    export: "Export",
    signInRequired: "Please sign in to view your billing consents.",
    loading: "Loading…",
    noRecordsTitle: "No consent records yet",
    noRecordsBody:
      "Once you upgrade, change, or cancel a plan, the corresponding informed-consent records will appear here for your transparency and audit needs.",
    recordIdLabel: "Record ID:",
    recordIdSuffix: "Stored permanently and cannot be modified.",
  },
  explainer: {
    title: "What this log proves under EU law",
    intro:
      "This page is your personal audit trail of every informed consent you've given for paid services on PortAI. It exists to satisfy our obligations and protect your rights under:",
    bullets: [
      {
        strong: "Directive 2011/83/EU (Consumer Rights)",
        rest: " — pre-contractual information, the 14-day right of withdrawal (Art. 9), the explicit waiver for digital services (Art. 16(m)), and pro-rata refund rules (Art. 14(3)).",
      },
      {
        strong: "GDPR (Regulation 2016/679)",
        rest: " — Art. 7(1) requires us to demonstrate that you consented; Art. 15 gives you the right to access these records.",
      },
      {
        strong: "Spanish Law 3/2014 (TRLGDCU) and LSSI-CE Law 34/2002",
        rest: " — local transposition of the above for distance contracts concluded in Spain.",
      },
    ],
    immutableStrong: "Immutable by design.",
    immutableRest:
      " Each record below is written once and can never be edited or back-dated — neither by you nor by us. The exact wording you saw, the timestamp, IP address, browser, plan, and price are preserved verbatim. You can export the full log at any time as JSON proof.",
  },
  withdrawal: {
    eligibleTitle: "Exercise your 14-day right of withdrawal",
    eligibleBodyPrefix: "You purchased on ",
    eligibleBodyMiddle:
      " and did not waive your withdrawal right. You may cancel this purchase and receive a refund (reduced pro-rata for any service already used) until ",
    eligibleBodySuffix: ".",
    submitCta: "Submit withdrawal request",
    alreadyOnFile:
      "Withdrawal request on file. Your statutory withdrawal request was received. Our legal team will process the pro-rata refund within 14 days of receipt (Directive 2011/83/EU Art. 13(1)). The immutable record is below.",
    modalTitle: "Statutory withdrawal — Model form",
    modalIntro:
      "Submitting this form is the official Annex I(B) model withdrawal statement under Directive 2011/83/EU Art. 11. We will record it immutably, stop your subscription, and process a pro-rata refund within 14 days (Art. 13(1) & 14(3)).",
    optionalReasonLabel: "Optional — reason for withdrawal",
    optionalReasonPlaceholder:
      "You are NOT required to give a reason. Anything you write here is stored verbatim with your withdrawal record.",
    whatHappensNext: "What happens next:",
    happens: [
      "Your withdrawal is timestamped and added to this log (immutable).",
      "Our legal team is notified and will refund the unused portion of the current month within 14 days, using your original payment method.",
      "Your subscription will be cancelled. You retain access only for the days you've already paid for, pro-rata.",
    ],
    cancelBtn: "Cancel",
    submitBtn: "Submit withdrawal",
  },
  card: {
    provesHeading: "What this record proves",
    legalBasisLabel: "Legal basis:",
    exactTextHeading: "Exact consent text shown to you",
    immutableHeading: "Immutable proof metadata",
    ipLabel: "IP address",
    priceIdLabel: "Price ID",
    userAgentLabel: "User agent",
    metadataLabel: "Metadata",
  },
  consentLabels: {
    checkout_terms: {
      label: "Checkout — Terms accepted",
      tone: "default",
      proves:
        "You read and accepted the Terms of Service, Privacy Policy and the recurring price before paying.",
      legalBasis:
        "Directive 2011/83/EU Art. 6 & 8 (pre-contractual information for distance contracts).",
    },
    eu_withdrawal_waiver: {
      label: "EU 14-day withdrawal — Waived",
      tone: "destructive",
      proves:
        "You expressly requested immediate access to the digital service AND acknowledged that this waives your 14-day right of withdrawal once performance has fully begun. No refund is owed after that point.",
      legalBasis:
        "Directive 2011/83/EU Art. 16(m) — requires explicit prior consent + acknowledgement of loss of withdrawal right.",
    },
    no_waiver_acknowledged: {
      label: "EU 14-day withdrawal — Kept",
      tone: "secondary",
      proves:
        "You did NOT waive your 14-day withdrawal right. You may request a refund within 14 calendar days, reduced in proportion to the service already used.",
      legalBasis:
        "Directive 2011/83/EU Art. 9 (right of withdrawal) & Art. 14(3) (pro-rata deduction).",
    },
    cancel_no_refund_acknowledged: {
      label: "Cancellation — No-refund acknowledged",
      tone: "outline",
      proves:
        "You cancelled auto-renewal and acknowledged that the current pre-paid billing period is not refunded. Access continues until the period ends.",
      legalBasis:
        "Contractual — cancellation of a recurring subscription does not retroactively refund a paid period (outside the 14-day withdrawal window).",
    },
    reactivate: {
      label: "Subscription reactivated",
      tone: "default",
      proves:
        "You reactivated auto-renewal on an existing subscription. Original consent and pricing terms continue to apply.",
      legalBasis:
        "Continuation of an existing distance contract (no new pre-contractual information required).",
    },
    eu_withdrawal_exercised: {
      label: "EU 14-day withdrawal — Exercised",
      tone: "destructive",
      proves:
        "You formally exercised your statutory 14-day right of withdrawal using the in-app model form. Our legal team must process a pro-rata refund within 14 days of receipt.",
      legalBasis:
        "Directive 2011/83/EU Art. 9, Art. 11 (means of withdrawal), Art. 13(1) (refund deadline) & Art. 14(3) (pro-rata deduction); Spanish RDL 1/2007 Art. 102 & 108.",
    },
  },
  tos: {
    sectionTitle: "9. Subscription, Payments and Right of Withdrawal",
    subscriptionStrong: "Subscription terms.",
    subscriptionIntro:
      " Certain premium features (Plus and Pro plans) require a paid monthly subscription processed by Stripe Payments Europe, Ltd. By subscribing, you agree to:",
    subscriptionBullets: [
      "Pay all fees associated with your chosen plan in advance, in EUR, on a recurring monthly basis",
      "Automatic renewal at the end of each billing period until you cancel",
      "Provide accurate, complete and up-to-date billing information",
      "Authorize PortAI (via Stripe) to charge your selected payment method on each renewal",
    ],
    cancellingStrong: "Cancelling.",
    cancellingBody:
      " You may cancel at any time from Settings → Subscription. After you cancel, you retain full access to your paid plan until the end of the current billing period; no further charges are made and you are not refunded for the remainder of the period (unless required by mandatory law — see the right of withdrawal below).",
    planChangesStrong: "Plan changes.",
    planChangesBody:
      " Upgrading from Plus to Pro charges only the prorated price difference for the remaining days of the current period. Downgrading from Pro to Plus is scheduled to take effect at the end of the current billing period — you are not charged again until the new plan begins.",
    withdrawalStrong: "Right of withdrawal (EU consumers).",
    withdrawalBodyBefore:
      " If you are a consumer resident in the European Union, you have the right to withdraw from a subscription contract within 14 calendar days of the initial purchase, without giving any reason, in accordance with Directive 2011/83/EU and the Spanish General Law for the Defence of Consumers and Users (Real Decreto Legislativo 1/2007). To exercise this right, you may either: (a) submit the in-app model withdrawal form available in Settings → My Billing Consents (preferred — your statement is timestamped and acknowledged automatically), or (b) send an email to ",
    withdrawalEmailLabel: "legal@portai-invest.com",
    withdrawalBodyAfter:
      " from the address associated with your account, stating your wish to withdraw. We will refund the amount due (after any pro-rata deduction) within 14 days of receipt, using your original payment method (Art. 13(1) of Directive 2011/83/EU).",
    partialUseEm: "Important — partial use during the withdrawal period:",
    partialUseBody:
      " By starting to use any premium feature (AI chat beyond the free tier, full quiz results, unlimited watchlists, article analyses or any other paid functionality) during the 14-day window, you expressly acknowledge and request that performance of the digital service begins immediately. If you then exercise your right of withdrawal, we may deduct an amount proportional to the service already provided (Art. 14(3) of Directive 2011/83/EU and Art. 108 of RDL 1/2007). For monthly subscriptions, this typically means a refund of the unused portion of the current month.",
    refundStrong: "Refund policy.",
    refundBody:
      " Outside of the statutory withdrawal right described above, subscription fees are non-refundable. We will, however, consider refund requests on a case-by-case basis for documented technical issues that prevented use of the service for an extended period.",
    priceChangeStrong: "Price changes.",
    priceChangeBody:
      " We reserve the right to change subscription pricing. Existing subscribers will be notified by email at least 30 days before any price change takes effect, and may cancel before the new price is applied.",
    failedPaymentStrong: "Failed payments.",
    failedPaymentBody:
      " If a renewal payment fails, your subscription will enter a \"past due\" state and we may attempt to collect again. If we are unable to collect within a reasonable period, your subscription will be cancelled and you will be returned to the Free plan.",
  },
};

// Spanish — primary jurisdiction (PortAI established in Spain).
// Reviewed against the Spanish official translation of Directive 2011/83/UE,
// RDL 1/2007 ("TRLGDCU"), Ley 3/2014, GDPR (RGPD) and LSSI-CE Ley 34/2002.
const es: LegalCopy = {
  page: {
    title: "Mis Consentimientos de Facturación",
    subtitle:
      "Un registro inalterable de cada pago, renuncia y aceptación de cancelación que has otorgado. Estos registros son inmutables — se conservan como prueba legal de tu consentimiento informado (Directiva 2011/83/UE).",
    backToSettings: "Volver a Ajustes",
    export: "Exportar",
    signInRequired: "Inicia sesión para ver tus consentimientos de facturación.",
    loading: "Cargando…",
    noRecordsTitle: "Aún no hay registros de consentimiento",
    noRecordsBody:
      "Cuando mejores, cambies o canceles un plan, los correspondientes registros de consentimiento informado aparecerán aquí para tu transparencia y necesidades de auditoría.",
    recordIdLabel: "ID de registro:",
    recordIdSuffix: "Almacenado permanentemente y no puede ser modificado.",
  },
  explainer: {
    title: "Lo que prueba este registro conforme al Derecho de la UE",
    intro:
      "Esta página es tu pista de auditoría personal de cada consentimiento informado que has otorgado para los servicios de pago de PortAI. Existe para cumplir con nuestras obligaciones y proteger tus derechos en virtud de:",
    bullets: [
      {
        strong: "Directiva 2011/83/UE (Derechos de los Consumidores)",
        rest: " — información precontractual, derecho de desistimiento de 14 días (Art. 9), renuncia expresa para servicios digitales (Art. 16(m)) y reglas de reembolso prorrateado (Art. 14(3)).",
      },
      {
        strong: "RGPD (Reglamento (UE) 2016/679)",
        rest: " — el Art. 7(1) nos exige demostrar que prestaste el consentimiento; el Art. 15 te otorga el derecho de acceso a estos registros.",
      },
      {
        strong: "Ley 3/2014 (TRLGDCU) y LSSI-CE Ley 34/2002",
        rest: " — transposición española de las normas anteriores para los contratos a distancia celebrados en España.",
      },
    ],
    immutableStrong: "Inmutable por diseño.",
    immutableRest:
      " Cada registro a continuación se escribe una sola vez y nunca puede ser editado ni retroactivado — ni por ti ni por nosotros. El texto exacto que viste, la fecha y hora, la dirección IP, el navegador, el plan y el precio se conservan literalmente. Puedes exportar el registro completo en cualquier momento como prueba en formato JSON.",
  },
  withdrawal: {
    eligibleTitle: "Ejerce tu derecho de desistimiento de 14 días",
    eligibleBodyPrefix: "Realizaste la compra el ",
    eligibleBodyMiddle:
      " y no renunciaste a tu derecho de desistimiento. Puedes cancelar esta compra y recibir un reembolso (reducido proporcionalmente por el servicio ya utilizado) hasta el ",
    eligibleBodySuffix: ".",
    submitCta: "Enviar solicitud de desistimiento",
    alreadyOnFile:
      "Solicitud de desistimiento registrada. Hemos recibido tu solicitud legal de desistimiento. Nuestro equipo legal procesará el reembolso prorrateado en un plazo de 14 días desde su recepción (Directiva 2011/83/UE Art. 13(1)). El registro inmutable aparece abajo.",
    modalTitle: "Desistimiento legal — Modelo de formulario",
    modalIntro:
      "Enviar este formulario constituye la declaración oficial de desistimiento del Anexo I(B) conforme al Art. 11 de la Directiva 2011/83/UE. Lo registraremos de forma inmutable, detendremos tu suscripción y procesaremos el reembolso prorrateado en un plazo de 14 días (Art. 13(1) y 14(3)).",
    optionalReasonLabel: "Opcional — motivo del desistimiento",
    optionalReasonPlaceholder:
      "NO estás obligado a dar un motivo. Lo que escribas aquí se almacenará literalmente junto con tu registro de desistimiento.",
    whatHappensNext: "Qué ocurre a continuación:",
    happens: [
      "Tu desistimiento queda fechado y se añade a este registro (inmutable).",
      "Se notifica a nuestro equipo legal, que reembolsará la parte no utilizada del mes en curso en un plazo de 14 días, usando el mismo método de pago original.",
      "Tu suscripción será cancelada. Solo conservas el acceso por los días ya pagados, prorrateado.",
    ],
    cancelBtn: "Cancelar",
    submitBtn: "Enviar desistimiento",
  },
  card: {
    provesHeading: "Lo que prueba este registro",
    legalBasisLabel: "Base jurídica:",
    exactTextHeading: "Texto exacto del consentimiento que se te mostró",
    immutableHeading: "Metadatos inmutables de prueba",
    ipLabel: "Dirección IP",
    priceIdLabel: "ID de precio",
    userAgentLabel: "Navegador (User Agent)",
    metadataLabel: "Metadatos",
  },
  consentLabels: {
    checkout_terms: {
      label: "Checkout — Términos aceptados",
      tone: "default",
      proves:
        "Leíste y aceptaste los Términos del Servicio, la Política de Privacidad y el precio recurrente antes de pagar.",
      legalBasis:
        "Directiva 2011/83/UE Art. 6 y 8 (información precontractual en contratos a distancia).",
    },
    eu_withdrawal_waiver: {
      label: "Desistimiento UE de 14 días — Renunciado",
      tone: "destructive",
      proves:
        "Solicitaste expresamente el acceso inmediato al servicio digital Y reconociste que ello implica la pérdida del derecho de desistimiento de 14 días una vez iniciada totalmente la prestación. No procede reembolso a partir de ese momento.",
      legalBasis:
        "Directiva 2011/83/UE Art. 16(m) — exige consentimiento expreso previo + reconocimiento de la pérdida del derecho de desistimiento.",
    },
    no_waiver_acknowledged: {
      label: "Desistimiento UE de 14 días — Conservado",
      tone: "secondary",
      proves:
        "NO renunciaste a tu derecho de desistimiento de 14 días. Puedes solicitar un reembolso en un plazo de 14 días naturales, reducido proporcionalmente al servicio ya utilizado.",
      legalBasis:
        "Directiva 2011/83/UE Art. 9 (derecho de desistimiento) y Art. 14(3) (deducción prorrateada).",
    },
    cancel_no_refund_acknowledged: {
      label: "Cancelación — Sin reembolso reconocido",
      tone: "outline",
      proves:
        "Cancelaste la renovación automática y reconociste que el período de facturación ya pagado no se reembolsa. El acceso continúa hasta el final del período.",
      legalBasis:
        "Contractual — la cancelación de una suscripción recurrente no reembolsa retroactivamente un período ya pagado (fuera de la ventana de desistimiento de 14 días).",
    },
    reactivate: {
      label: "Suscripción reactivada",
      tone: "default",
      proves:
        "Reactivaste la renovación automática de una suscripción existente. Se mantienen el consentimiento original y las condiciones de precio.",
      legalBasis:
        "Continuación de un contrato a distancia existente (no se requiere nueva información precontractual).",
    },
    eu_withdrawal_exercised: {
      label: "Desistimiento UE de 14 días — Ejercido",
      tone: "destructive",
      proves:
        "Ejerciste formalmente tu derecho legal de desistimiento de 14 días utilizando el modelo de formulario integrado. Nuestro equipo legal debe procesar el reembolso prorrateado en un plazo de 14 días desde su recepción.",
      legalBasis:
        "Directiva 2011/83/UE Art. 9, Art. 11 (medios de desistimiento), Art. 13(1) (plazo de reembolso) y Art. 14(3) (deducción prorrateada); RDL 1/2007 español Art. 102 y 108.",
    },
  },
  tos: {
    sectionTitle: "9. Suscripción, pagos y derecho de desistimiento",
    subscriptionStrong: "Condiciones de la suscripción.",
    subscriptionIntro:
      " Determinadas funciones premium (planes Plus y Pro) requieren una suscripción mensual de pago procesada por Stripe Payments Europe, Ltd. Al suscribirte, aceptas:",
    subscriptionBullets: [
      "Pagar todas las tarifas asociadas a tu plan elegido por adelantado, en EUR, de forma mensual recurrente",
      "La renovación automática al final de cada período de facturación hasta que canceles",
      "Proporcionar información de facturación exacta, completa y actualizada",
      "Autorizar a PortAI (a través de Stripe) a cargar el método de pago seleccionado en cada renovación",
    ],
    cancellingStrong: "Cancelación.",
    cancellingBody:
      " Puedes cancelar en cualquier momento desde Ajustes → Suscripción. Tras cancelar, conservas el acceso íntegro a tu plan de pago hasta el final del período de facturación en curso; no se realizarán cargos adicionales y no se reembolsa el resto del período (salvo que lo exija una norma imperativa — véase el derecho de desistimiento más abajo).",
    planChangesStrong: "Cambios de plan.",
    planChangesBody:
      " Mejorar de Plus a Pro solo cobra la diferencia de precio prorrateada por los días restantes del período en curso. Bajar de Pro a Plus se programa para entrar en vigor al final del período de facturación en curso — no se vuelve a cobrar hasta que comience el nuevo plan.",
    withdrawalStrong: "Derecho de desistimiento (consumidores de la UE).",
    withdrawalBodyBefore:
      " Si eres un consumidor residente en la Unión Europea, tienes derecho a desistir del contrato de suscripción en un plazo de 14 días naturales desde la compra inicial, sin necesidad de justificar tu decisión, conforme a la Directiva 2011/83/UE y al Texto Refundido de la Ley General para la Defensa de los Consumidores y Usuarios (Real Decreto Legislativo 1/2007). Para ejercer este derecho puedes: (a) enviar el modelo de formulario de desistimiento integrado en la app, disponible en Ajustes → Mis Consentimientos de Facturación (preferido — tu declaración queda fechada y reconocida automáticamente), o (b) enviar un correo electrónico a ",
    withdrawalEmailLabel: "legal@portai-invest.com",
    withdrawalBodyAfter:
      " desde la dirección asociada a tu cuenta, manifestando tu voluntad de desistir. Reembolsaremos el importe debido (tras la deducción prorrateada que corresponda) en un plazo de 14 días desde la recepción, utilizando tu método de pago original (Art. 13(1) de la Directiva 2011/83/UE).",
    partialUseEm: "Importante — uso parcial durante el plazo de desistimiento:",
    partialUseBody:
      " Al comenzar a utilizar cualquier función premium (chat IA más allá del nivel gratuito, resultados completos del quiz, listas de seguimiento ilimitadas, análisis de artículos o cualquier otra funcionalidad de pago) durante la ventana de 14 días, reconoces y solicitas expresamente que la prestación del servicio digital comience de inmediato. Si después ejercitas el derecho de desistimiento, podremos deducir un importe proporcional al servicio ya prestado (Art. 14(3) de la Directiva 2011/83/UE y Art. 108 del RDL 1/2007). Para suscripciones mensuales, esto suele traducirse en el reembolso de la parte no utilizada del mes en curso.",
    refundStrong: "Política de reembolsos.",
    refundBody:
      " Fuera del derecho legal de desistimiento descrito anteriormente, las cuotas de suscripción no son reembolsables. No obstante, valoraremos solicitudes de reembolso caso por caso ante incidencias técnicas documentadas que hayan impedido el uso del servicio durante un período prolongado.",
    priceChangeStrong: "Cambios de precio.",
    priceChangeBody:
      " Nos reservamos el derecho a modificar los precios de la suscripción. Notificaremos a los suscriptores existentes por correo electrónico con al menos 30 días de antelación a la entrada en vigor de cualquier cambio de precio, pudiendo cancelar antes de que se aplique el nuevo precio.",
    failedPaymentStrong: "Pagos fallidos.",
    failedPaymentBody:
      " Si una renovación falla, tu suscripción pasará a estado \"past due\" e intentaremos cobrar de nuevo. Si no podemos cobrar en un plazo razonable, la suscripción será cancelada y volverás al plan Free.",
  },
};

// Other supported app languages → fall back to English. We deliberately do
// NOT machine-translate legal copy on the fly. If/when a reviewed translation
// is available for fr/pt/de/it, drop it in here.
const TABLE: Partial<Record<Language, LegalCopy>> = { en, es };

export const getLegalCopy = (lang: Language): LegalCopy => TABLE[lang] ?? en;
