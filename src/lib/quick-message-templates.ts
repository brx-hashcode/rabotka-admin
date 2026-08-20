/**
 * Ready-to-send message templates for the admin → profile quick message flows.
 *
 * Everything here is in French: the bodies because that is what the
 * worker/employer receives (like the transactional emails), the labels and
 * categories so the picker reads in the same language as the message it
 * inserts.
 *
 * `{{prenom}}` is filled from the selected profile. Square brackets such as
 * `[date]` are deliberate blanks the admin edits before sending.
 */

export type QuickMessageAudience = "WORKER" | "EMPLOYER" | "BOTH";

export type QuickMessageTemplate = {
  id: string;
  /** Short name shown in the picker. */
  label: string;
  /** Grouping used to section the picker. */
  category: string;
  audience: QuickMessageAudience;
  body: string;
};

export const QUICK_MESSAGE_TEMPLATES: readonly QuickMessageTemplate[] = [
  // ── Verification (KYC) ────────────────────────────────────────────────────
  {
    id: "kyc-documents-missing",
    label: "Documents KYC manquants",
    category: "Vérification",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Pour finaliser la vérification de votre compte Rabotka, il nous manque encore : [document(s) manquant(s)].

Vous pouvez les ajouter depuis votre profil, rubrique « Vérification d'identité ». Dès réception, votre dossier est traité sous 48 h.
`,
  },
  {
    id: "kyc-document-unreadable",
    label: "Document illisible",
    category: "Vérification",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Le document que vous avez envoyé n'est pas exploitable (photo floue, coins coupés ou informations illisibles).

Merci de le renvoyer en photographiant le document entier, à plat et bien éclairé. Nous relançons la vérification dès réception.

`,
  },
  {
    id: "kyc-reminder",
    label: "Relance vérification KYC",
    category: "Vérification",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Votre compte Rabotka est créé mais la vérification d'identité n'est pas encore terminée. Tant qu'elle n'est pas validée, votre profil reste invisible et vous ne pouvez pas [postuler / publier d'offres].

Cela ne prend que quelques minutes depuis votre profil.

`,
  },
  {
    id: "kyc-approved",
    label: "KYC validé",
    category: "Vérification",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Bonne nouvelle : votre identité a été vérifiée et votre compte Rabotka est maintenant pleinement actif. Votre badge « Vérifié » est visible par les autres membres.

`,
  },
  {
    id: "verification-call",
    label: "Proposer un appel de vérification",
    category: "Vérification",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Dans le cadre de la vérification de votre compte, nous souhaitons échanger brièvement avec vous par téléphone (5 minutes).

Êtes-vous disponible le [date] vers [heure] ? Si ce créneau ne convient pas, proposez-nous simplement un autre moment.

`,
  },

  // ── Profile & account ─────────────────────────────────────────────────────
  {
    id: "profile-incomplete",
    label: "Profil incomplet",
    category: "Profil & compte",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Votre profil Rabotka est incomplet : il manque [photo / description / catégories / zone d'intervention].

Les profils complets reçoivent nettement plus de [propositions de mission / candidatures]. Quelques minutes suffisent pour le mettre à jour.

`,
  },
  {
    id: "contact-details-check",
    label: "Confirmer les coordonnées",
    category: "Profil & compte",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Nous n'arrivons pas à vous joindre sur le numéro enregistré dans votre compte.

Pouvez-vous confirmer votre numéro WhatsApp et votre adresse e-mail, ou les corriger directement depuis votre profil ? C'est par ce canal que passent toutes les notifications importantes.

`,
  },
  {
    id: "account-warning",
    label: "Avertissement de comportement",
    category: "Profil & compte",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Nous avons reçu un signalement concernant [motif] sur votre compte Rabotka.

Nous vous invitons à respecter les règles de la plateforme : ponctualité, respect des engagements et communication passant par Rabotka. En cas de récidive, votre compte pourra être suspendu.

Si vous souhaitez nous donner votre version, répondez à ce message.

`,
  },
  {
    id: "account-reactivated",
    label: "Compte réactivé",
    category: "Profil & compte",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Votre compte Rabotka a été réactivé et vous pouvez de nouveau [postuler / publier vos offres].

Merci d'avoir régularisé la situation,
`,
  },

  // ── Missions (workers) ────────────────────────────────────────────────────
  {
    id: "worker-opportunity",
    label: "Opportunité de mission",
    category: "Missions (travailleurs)",
    audience: "WORKER",
    body: `Bonjour {{prenom}},

Une mission correspondant à votre profil vient d'être publiée : [intitulé] à [lieu], le [date].

Si cela vous intéresse, postulez rapidement depuis l'application — les places partent vite.

`,
  },
  {
    id: "worker-employer-waiting",
    label: "L'employeur attend une réponse",
    category: "Missions (travailleurs)",
    audience: "WORKER",
    body: `Bonjour {{prenom}},

L'employeur de la mission « [intitulé] » attend votre réponse depuis [durée].

Merci de confirmer ou de décliner directement dans l'application, afin qu'il puisse s'organiser.

`,
  },
  {
    id: "worker-mission-reminder",
    label: "Rappel avant la mission",
    category: "Missions (travailleurs)",
    audience: "WORKER",
    body: `Bonjour {{prenom}},

Petit rappel : votre mission « [intitulé] » commence le [date] à [heure], à [lieu].

Merci d'arriver 10 minutes en avance. En cas d'imprévu, prévenez l'employeur au plus tôt via l'application.

`,
  },
  {
    id: "worker-no-show",
    label: "Suivi d'absence",
    category: "Missions (travailleurs)",
    audience: "WORKER",
    body: `Bonjour {{prenom}},

L'employeur nous a signalé votre absence à la mission « [intitulé] » du [date], sans avoir été prévenu.

Les absences non signalées affectent votre score de fiabilité et peuvent entraîner une pénalité. Pouvez-vous nous expliquer ce qu'il s'est passé ?

`,
  },
  {
    id: "worker-reliability-low",
    label: "Score de fiabilité en baisse",
    category: "Missions (travailleurs)",
    audience: "WORKER",
    body: `Bonjour {{prenom}},

Votre score de fiabilité a baissé à la suite de [annulations tardives / absences / retards].

Un score faible réduit fortement votre visibilité auprès des employeurs. Il remonte dès que vos prochaines missions se déroulent bien.

Nous restons disponibles si vous rencontrez des difficultés,
`,
  },

  // ── Recruitment (employers) ───────────────────────────────────────────────
  {
    id: "employer-applications-pending",
    label: "Candidatures à traiter",
    category: "Recrutement (employeurs)",
    audience: "EMPLOYER",
    body: `Bonjour {{prenom}},

Votre offre « [intitulé] » a reçu [nombre] candidature(s) en attente de réponse.

Les candidats se désengagent après quelques jours sans nouvelles : un passage rapide dans l'application suffit pour accepter ou décliner.

`,
  },
  {
    id: "employer-offer-incomplete",
    label: "Offre à compléter",
    category: "Recrutement (employeurs)",
    audience: "EMPLOYER",
    body: `Bonjour {{prenom}},

Votre offre « [intitulé] » manque de précisions sur [rémunération / horaires / lieu / tâches] et attire donc peu de candidats.

En complétant ces informations, vous recevrez des candidatures plus nombreuses et mieux ciblées.

`,
  },
  {
    id: "employer-offer-expiring",
    label: "Offre bientôt expirée",
    category: "Recrutement (employeurs)",
    audience: "EMPLOYER",
    body: `Bonjour {{prenom}},

Votre offre « [intitulé] » expire le [date] et n'est pas encore pourvue.

Vous pouvez la prolonger ou l'ajuster (date, rémunération, zone) depuis votre espace pour toucher davantage de candidats.

`,
  },
  {
    id: "employer-offer-rejected",
    label: "Offre refusée par la modération",
    category: "Recrutement (employeurs)",
    audience: "EMPLOYER",
    body: `Bonjour {{prenom}},

Votre offre « [intitulé] » n'a pas été publiée car elle ne respecte pas nos règles : [motif].

Vous pouvez la modifier et la soumettre à nouveau ; nous la réexaminons dans la foulée.

`,
  },
  {
    id: "employer-confirm-completion",
    label: "Confirmer la fin de mission",
    category: "Recrutement (employeurs)",
    audience: "EMPLOYER",
    body: `Bonjour {{prenom}},

La mission « [intitulé] » du [date] est-elle bien terminée ?

Merci de la clôturer dans l'application et de laisser une évaluation au travailleur : cela conditionne son score de fiabilité et le suivi de votre dossier.

`,
  },

  // ── Payments & penalties ──────────────────────────────────────────────────
  {
    id: "penalty-unpaid",
    label: "Relance pénalité impayée",
    category: "Paiements & pénalités",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Une pénalité de [montant] reste impayée sur votre compte, suite à [motif] du [date].

Merci de la régler depuis l'application afin de retrouver un accès complet à la plateforme. Si vous contestez cette pénalité, répondez à ce message.

`,
  },
  {
    id: "payment-received",
    label: "Paiement reçu",
    category: "Paiements & pénalités",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Nous confirmons la réception de votre paiement de [montant]. Votre compte est à jour, rien d'autre n'est requis de votre part.

`,
  },
  {
    id: "payment-failed",
    label: "Paiement échoué",
    category: "Paiements & pénalités",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Votre paiement de [montant] n'a pas abouti ([motif]).

Vous pouvez réessayer depuis l'application, ou nous indiquer le moyen de paiement que vous souhaitez utiliser.

`,
  },

  // ── Support ───────────────────────────────────────────────────────────────
  {
    id: "support-acknowledged",
    label: "Demande bien reçue",
    category: "Support",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Nous avons bien reçu votre demande et elle est en cours de traitement. Nous revenons vers vous sous [délai] avec une réponse.

`,
  },
  {
    id: "support-need-info",
    label: "Informations complémentaires",
    category: "Support",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Pour avancer sur votre dossier, nous avons besoin de précisions : [informations demandées].

Vous pouvez répondre directement à ce message, en joignant une capture d'écran si besoin.

`,
  },
  {
    id: "support-resolved",
    label: "Problème résolu",
    category: "Support",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Le problème que vous nous avez signalé est résolu : [résumé].

N'hésitez pas à nous réécrire si vous constatez encore un souci.

`,
  },
  {
    id: "support-feedback",
    label: "Demande d'avis",
    category: "Support",
    audience: "BOTH",
    body: `Bonjour {{prenom}},

Vous avez récemment utilisé Rabotka pour [mission / recrutement]. Comment cela s'est-il passé ?

Vos retours, positifs comme négatifs, nous aident à améliorer la plateforme. Répondez simplement à ce message.

`,
  },
] as const;

/** Templates addressed to this profile type, plus the ones sent to everyone. */
export function getQuickMessageTemplates(
  profileType?: string | null,
): QuickMessageTemplate[] {
  if (profileType !== "WORKER" && profileType !== "EMPLOYER") {
    return [...QUICK_MESSAGE_TEMPLATES];
  }

  return QUICK_MESSAGE_TEMPLATES.filter(
    (template) =>
      template.audience === "BOTH" || template.audience === profileType,
  );
}

/** Same templates, grouped by category and keeping the declaration order. */
export function groupQuickMessageTemplates(
  templates: QuickMessageTemplate[],
): { category: string; templates: QuickMessageTemplate[] }[] {
  const groups: { category: string; templates: QuickMessageTemplate[] }[] = [];

  for (const template of templates) {
    const group = groups.find((g) => g.category === template.category);
    if (group) group.templates.push(template);
    else groups.push({ category: template.category, templates: [template] });
  }

  return groups;
}

/**
 * Fills `{{prenom}}` with the recipient's first name, falling back to a
 * name-less greeting when no profile is selected yet.
 */
export function renderQuickMessage(
  template: QuickMessageTemplate,
  firstName?: string | null,
): string {
  const name = firstName?.trim() ?? "";

  return template.body
    .replaceAll("{{prenom}}", name)
    .replaceAll(/[ \t](?=[,.])/g, "");
}
