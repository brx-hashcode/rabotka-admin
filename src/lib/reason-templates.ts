/**
 * Ready-to-use reason snippets for the admin decision modals: account
 * activation/suspension, KYC verification and payment verification.
 *
 * Everything here is in French, for the same reason as the quick message
 * templates: most of what the admin types in these fields is not an internal
 * note. The backend hands it straight back to the user — a KYC rejection lands
 * in the `Motif :` line of the French rejection email, a suspension reason is
 * returned on every 403 the suspended account gets. So the labels read in the
 * language of the text they insert.
 *
 * The two halves are written in different voices, and mixing them up is the
 * easy mistake here:
 *
 * - REJECT/SUSPEND bodies reach the user, so they state the motive and nothing
 *   else. In particular they must not open with "Votre compte est suspendu" —
 *   `AccountNotActiveException` already says that, and returns the reason as a
 *   separate field next to it.
 * - APPROVE/ACCEPT/ACTIVATE bodies never reach the user. The KYC one is kept as
 *   `kyc_verification_note` and shown admin-side; the activation one is not
 *   stored on the profile at all and survives only in the `PROFILE_STATUS_UPDATED`
 *   audit log. They are terse notes for whoever reads the file next.
 *
 * Square brackets such as `[montant]` are deliberate blanks the admin fills in
 * before confirming. Unlike the quick message bodies there is no `{{prenom}}`:
 * a reason states a fact about the file, it is not addressed to anyone.
 */

export type ReasonTemplateScope =
  | "ACCOUNT_ACTIVATE"
  | "ACCOUNT_SUSPEND"
  | "KYC_APPROVE"
  | "KYC_REJECT"
  | "PAYMENT_ACCEPT"
  | "PAYMENT_REJECT"
  | "PENALTY";

export type ReasonTemplate = {
  id: string;
  /** Short name shown in the picker. */
  label: string;
  /** Grouping used to section the picker. */
  category: string;
  /** Decisions this snippet is offered for. */
  scopes: readonly ReasonTemplateScope[];
  /** Inserted as-is. A full sentence, so two of them concatenate cleanly. */
  body: string;
};

export const REASON_TEMPLATES: readonly ReasonTemplate[] = [
  // ── Penalty ───────────────────────────────────────────────────────────────
  // These reach the worker: the reason is shown on the penalty and repeated in
  // the WhatsApp notice, so they state what happened and nothing else. Amounts
  // are never written here — the amount is its own field, and a figure typed
  // into the prose goes stale the moment somebody edits it.
  {
    id: "penalty-no-show",
    label: "Absence non justifiée",
    category: "Présence",
    scopes: ["PENALTY"],
    body: "Absence non justifiée au poste : la mission n'a pas été assurée et aucun motif n'a été communiqué avant l'heure de début.",
  },
  {
    id: "penalty-late",
    label: "Retard",
    category: "Présence",
    scopes: ["PENALTY"],
    body: "Retard supérieur à [durée] sur une mission confirmée, sans prévenir l'employeur.",
  },
  {
    id: "penalty-late-cancel",
    label: "Annulation tardive",
    category: "Présence",
    scopes: ["PENALTY"],
    body: "Annulation à moins de [délai] du début de la mission, alors que la candidature avait été acceptée.",
  },
  {
    id: "penalty-abandon",
    label: "Mission abandonnée",
    category: "Exécution",
    scopes: ["PENALTY"],
    body: "Mission quittée avant son terme sans accord de l'employeur.",
  },
  {
    id: "penalty-quality",
    label: "Travail non conforme",
    category: "Exécution",
    scopes: ["PENALTY"],
    body: "Travail non conforme à ce qui avait été convenu, constaté et documenté par l'employeur.",
  },
  {
    id: "penalty-bypass",
    label: "Contournement de la plateforme",
    category: "Conduite",
    scopes: ["PENALTY"],
    body: "Arrangement conclu en dehors de la plateforme après une mise en relation payée.",
  },
  {
    id: "penalty-behaviour",
    label: "Comportement inapproprié",
    category: "Conduite",
    scopes: ["PENALTY"],
    body: "Comportement inapproprié signalé et vérifié : propos ou attitude incompatibles avec les règles de la plateforme.",
  },
  // ── KYC rejected ──────────────────────────────────────────────────────────
  {
    id: "kyc-reject-unreadable",
    label: "Document illisible",
    category: "Document",
    scopes: ["KYC_REJECT"],
    body: "Le document transmis n'est pas exploitable : photo floue, coins coupés ou informations illisibles. Merci de le renvoyer entier, à plat et bien éclairé.",
  },
  {
    id: "kyc-reject-expired",
    label: "Document expiré",
    category: "Document",
    scopes: ["KYC_REJECT"],
    body: "Le document d'identité transmis est expiré depuis le [date]. Merci de fournir un document en cours de validité.",
  },
  {
    id: "kyc-reject-wrong-type",
    label: "Type de document non accepté",
    category: "Document",
    scopes: ["KYC_REJECT"],
    body: "Le document fourni n'est pas accepté. Merci de transmettre une carte nationale d'identité, un passeport ou un permis de conduire en cours de validité.",
  },
  {
    id: "kyc-reject-incomplete",
    label: "Dossier incomplet",
    category: "Document",
    scopes: ["KYC_REJECT"],
    body: "Le dossier est incomplet : il manque encore [document(s) manquant(s)].",
  },
  {
    id: "kyc-reject-selfie-missing",
    label: "Selfie manquant",
    category: "Identité",
    scopes: ["KYC_REJECT"],
    body: "Le selfie tenant le document d'identité n'a pas été transmis.",
  },
  {
    id: "kyc-reject-selfie-mismatch",
    label: "Selfie non conforme",
    category: "Identité",
    scopes: ["KYC_REJECT"],
    body: "Le selfie transmis ne correspond pas à la photo du document d'identité fourni.",
  },
  {
    id: "kyc-reject-name-mismatch",
    label: "Identité incohérente",
    category: "Identité",
    scopes: ["KYC_REJECT"],
    body: "Le nom figurant sur le document ne correspond pas à celui renseigné sur le profil Rabotka.",
  },
  {
    id: "kyc-reject-suspected-forgery",
    label: "Document suspecté falsifié",
    category: "Fraude",
    scopes: ["KYC_REJECT"],
    body: "Le document présente des signes d'altération. Le dossier est transmis au support pour vérification approfondie.",
  },

  // ── KYC approved ──────────────────────────────────────────────────────────
  {
    id: "kyc-approve-standard",
    label: "Dossier conforme",
    category: "Validation",
    scopes: ["KYC_APPROVE"],
    body: "Pièce d'identité et selfie conformes. Identité vérifiée.",
  },
  {
    id: "kyc-approve-after-resubmission",
    label: "Validé après renvoi",
    category: "Validation",
    scopes: ["KYC_APPROVE"],
    body: "Nouveau document reçu et conforme après une première demande de renvoi. Identité vérifiée.",
  },
  {
    id: "kyc-approve-low-quality",
    label: "Validé malgré la qualité",
    category: "Validation",
    scopes: ["KYC_APPROVE"],
    body: "Qualité de la photo moyenne, mais informations lisibles et concordantes. Identité vérifiée.",
  },
  {
    id: "kyc-approve-manual-check",
    label: "Vérification manuelle",
    category: "Validation",
    scopes: ["KYC_APPROVE"],
    body: "Document vérifié manuellement par le support après contact direct avec l'utilisateur.",
  },

  // ── Account suspended ─────────────────────────────────────────────────────
  {
    id: "suspend-abusive-behaviour",
    label: "Comportement inapproprié",
    category: "Comportement",
    scopes: ["ACCOUNT_SUSPEND"],
    body: "Signalements répétés concernant votre comportement envers d'autres utilisateurs.",
  },
  {
    id: "suspend-repeated-no-show",
    label: "Absences répétées",
    category: "Comportement",
    scopes: ["ACCOUNT_SUSPEND"],
    body: "[nombre] absences non justifiées sur des missions que vous aviez acceptées.",
  },
  {
    id: "suspend-spam",
    label: "Sollicitations répétées",
    category: "Comportement",
    scopes: ["ACCOUNT_SUSPEND"],
    body: "Envoi répété de messages non sollicités à d'autres utilisateurs.",
  },
  {
    id: "suspend-off-platform",
    label: "Contournement de la plateforme",
    category: "Conformité",
    scopes: ["ACCOUNT_SUSPEND"],
    body: "Tentative de mise en relation en dehors de Rabotka.",
  },
  {
    id: "suspend-unpaid-penalties",
    label: "Pénalités impayées",
    category: "Conformité",
    scopes: ["ACCOUNT_SUSPEND"],
    body: "Pénalités en attente non réglées. L'accès est rétabli dès leur règlement.",
  },
  {
    id: "suspend-profile-mismatch",
    label: "Informations non conformes",
    category: "Conformité",
    scopes: ["ACCOUNT_SUSPEND"],
    body: "Les informations de votre profil ne correspondent pas aux documents fournis. Vérification en cours.",
  },
  {
    id: "suspend-pending-investigation",
    label: "Enquête en cours",
    category: "Conformité",
    scopes: ["ACCOUNT_SUSPEND"],
    body: "Examen d'un signalement en cours. Le support revient vers vous sous [délai].",
  },

  // ── Account activated ─────────────────────────────────────────────────────
  {
    id: "activate-kyc-validated",
    label: "KYC validé",
    category: "Activation",
    scopes: ["ACCOUNT_ACTIVATE"],
    body: "Vérification d'identité validée.",
  },
  {
    id: "activate-suspension-lifted",
    label: "Levée de suspension",
    category: "Activation",
    scopes: ["ACCOUNT_ACTIVATE"],
    body: "Situation régularisée, suspension levée.",
  },
  {
    id: "activate-penalties-settled",
    label: "Pénalités réglées",
    category: "Activation",
    scopes: ["ACCOUNT_ACTIVATE"],
    body: "Pénalités en attente réglées.",
  },
  {
    id: "activate-after-support-review",
    label: "Après examen du support",
    category: "Activation",
    scopes: ["ACCOUNT_ACTIVATE"],
    body: "Dossier examiné par le support, aucun élément bloquant.",
  },
  {
    id: "activate-manual",
    label: "Activation manuelle",
    category: "Activation",
    scopes: ["ACCOUNT_ACTIVATE"],
    body: "Activation manuelle à la demande de l'utilisateur.",
  },

  // ── Payment rejected ──────────────────────────────────────────────────────
  {
    id: "payment-reject-not-received",
    label: "Paiement non reçu",
    category: "Paiement",
    scopes: ["PAYMENT_REJECT"],
    body: "Aucun versement correspondant à cette demande n'a été retrouvé sur le compte Rabotka.",
  },
  {
    id: "payment-reject-amount-mismatch",
    label: "Montant incorrect",
    category: "Paiement",
    scopes: ["PAYMENT_REJECT"],
    body: "Le montant reçu ([montant] FCFA) ne correspond pas au montant attendu.",
  },
  {
    id: "payment-reject-proof-unreadable",
    label: "Preuve illisible",
    category: "Paiement",
    scopes: ["PAYMENT_REJECT"],
    body: "La preuve de paiement transmise n'est pas exploitable. Merci de renvoyer une capture complète et lisible.",
  },
  {
    id: "payment-reject-reference-not-found",
    label: "Référence introuvable",
    category: "Paiement",
    scopes: ["PAYMENT_REJECT"],
    body: "La référence de transaction fournie est introuvable auprès de l'opérateur.",
  },
  {
    id: "payment-reject-duplicate",
    label: "Doublon",
    category: "Paiement",
    scopes: ["PAYMENT_REJECT"],
    body: "Cette demande fait doublon avec un paiement déjà traité.",
  },

  // ── Payment accepted ──────────────────────────────────────────────────────
  {
    id: "payment-accept-confirmed",
    label: "Paiement confirmé",
    category: "Paiement",
    scopes: ["PAYMENT_ACCEPT"],
    body: "Versement reçu et rapproché avec la référence transmise.",
  },
  {
    id: "payment-accept-manual",
    label: "Rapprochement manuel",
    category: "Paiement",
    scopes: ["PAYMENT_ACCEPT"],
    body: "Paiement confirmé manuellement après vérification auprès de l'opérateur.",
  },
  {
    id: "payment-accept-minor-gap",
    label: "Écart mineur accepté",
    category: "Paiement",
    scopes: ["PAYMENT_ACCEPT"],
    body: "Écart mineur constaté sur le montant, accepté par le support.",
  },
] as const;

/** Snippets offered for this decision. No decision picked yet means none. */
export function getReasonTemplates(
  scope: ReasonTemplateScope | null,
): ReasonTemplate[] {
  if (scope == null) return [];

  return REASON_TEMPLATES.filter((template) => template.scopes.includes(scope));
}

/** Same snippets, grouped by category and keeping the declaration order. */
export function groupReasonTemplates(
  templates: ReasonTemplate[],
): { category: string; templates: ReasonTemplate[] }[] {
  const groups: { category: string; templates: ReasonTemplate[] }[] = [];

  for (const template of templates) {
    const group = groups.find((g) => g.category === template.category);
    if (group) group.templates.push(template);
    else groups.push({ category: template.category, templates: [template] });
  }

  return groups;
}

/**
 * Adds a snippet to what the admin already wrote, so picking a second one
 * never wipes the first.
 *
 * Joined by a single space rather than a blank line: these fields hold one or
 * two sentences, and the transactional emails render the whole reason inside a
 * single paragraph where a line break would collapse anyway.
 */
export function appendReason(current: string, body: string): string {
  const existing = current.trimEnd();

  return existing ? `${existing} ${body}` : body;
}
