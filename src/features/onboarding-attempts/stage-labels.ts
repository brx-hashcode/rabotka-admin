import {
  ONBOARDING_STAGES,
  type AdminOnboardingStats,
  type OnboardingStage,
} from "#/lib/api/onboarding-attempts-controller";

/**
 * Where the person stopped, said as the screen they were on — an admin calling
 * them needs « bloqué au code », not an enum.
 */
export const STAGE_LABELS: Record<OnboardingStage, string> = {
  CODE_SENT: "Code WhatsApp",
  PHONE_VERIFIED: "Type de profil",
  DOCUMENTS: "Pièces d'identité",
  CONFIRMATION: "Dernière étape",
  COMPLETED: "Compte créé",
};

/** What the step's card says about the people who stopped there. */
export const STOPPED_HINTS: Record<OnboardingStage, string> = {
  CODE_SENT: "Code demandé, jamais saisi",
  PHONE_VERIFIED: "Numéro vérifié, puis plus rien",
  DOCUMENTS: "Arrivés aux pièces, pas plus loin",
  CONFIRMATION: "Au dernier écran, sans valider",
  COMPLETED: "Inscription terminée",
};

/** The stages someone can stop at — every one but the end. */
export const DROP_STAGES = ONBOARDING_STAGES.filter((s) => s !== "COMPLETED");

/**
 * How many stopped AT each stage, from the funnel's "reached or further"
 * counts: those who reached it minus those who reached the next one.
 */
export function stoppedAt(
  funnel: AdminOnboardingStats["funnel"],
): Record<OnboardingStage, number> {
  const reached = new Map(funnel.map((f) => [f.stage, f.count]));
  const out = {} as Record<OnboardingStage, number>;
  ONBOARDING_STAGES.forEach((stage, i) => {
    const here = reached.get(stage) ?? 0;
    const next = ONBOARDING_STAGES[i + 1];
    out[stage] = next ? here - (reached.get(next) ?? 0) : here;
  });
  return out;
}

/** 0-based position of a stage, for the progress bar. */
export function stageIndex(stage: OnboardingStage): number {
  return ONBOARDING_STAGES.indexOf(stage);
}

/** « à l'instant », « il y a 5 min », « il y a 3 h », « il y a 2 j », then a date. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr", { day: "numeric", month: "short" });
}

/** A wa.me link: digits only, no plus. */
export function whatsAppLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}
