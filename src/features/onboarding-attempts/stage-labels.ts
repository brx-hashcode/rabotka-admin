import type { OnboardingStage } from "#/lib/api/onboarding-attempts-controller";

/**
 * Where the person stopped, said as the screen they were on — an admin calling
 * them needs « bloqué au code », not an enum.
 */
export const STAGE_LABELS: Record<OnboardingStage, string> = {
  CODE_SENT: "Code non saisi",
  PHONE_VERIFIED: "Numéro vérifié",
  DOCUMENTS: "Pièces d'identité",
  CONFIRMATION: "Dernière étape",
  COMPLETED: "Compte créé",
};

/** The funnel's own wording: how many got at least this far. */
export const FUNNEL_LABELS: Record<OnboardingStage, string> = {
  CODE_SENT: "Ont demandé le code",
  PHONE_VERIFIED: "Ont vérifié leur numéro",
  DOCUMENTS: "Ont atteint les pièces",
  CONFIRMATION: "Ont atteint la dernière étape",
  COMPLETED: "Ont créé leur compte",
};

/** A wa.me link: digits only, no plus. */
export function whatsAppLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}
