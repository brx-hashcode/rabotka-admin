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

/** The funnel's steps as « reached », each a step further than the last. */
export const REACHED_LABELS: Record<OnboardingStage, string> = {
  CODE_SENT: "Code WhatsApp demandé",
  PHONE_VERIFIED: "Numéro vérifié",
  DOCUMENTS: "Pièces d'identité",
  CONFIRMATION: "Dernière étape",
  COMPLETED: "Compte créé",
};

export type DropoffPeriod = "7d" | "30d" | "90d" | "all";

export const PERIOD_LABELS: Record<DropoffPeriod, string> = {
  "7d": "7 j",
  "30d": "30 j",
  "90d": "90 j",
  all: "Tout",
};

const PERIOD_DAYS: Record<Exclude<DropoffPeriod, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/**
 * The window a period covers, and the one just before it — the comparison
 * that tells « 12 abandons » from « 12 abandons, deux fois plus que le mois
 * dernier ». « Tout » has no previous window.
 */
export function periodWindows(
  period: DropoffPeriod,
  now: Date = new Date(),
): {
  current: { startedFrom?: string; startedTo?: string };
  previous: { startedFrom: string; startedTo: string } | null;
} {
  if (period === "all") return { current: {}, previous: null };
  const span = PERIOD_DAYS[period] * 86_400_000;
  const from = new Date(now.getTime() - span);
  const prevFrom = new Date(from.getTime() - span);
  return {
    current: { startedFrom: from.toISOString() },
    previous: {
      startedFrom: prevFrom.toISOString(),
      startedTo: from.toISOString(),
    },
  };
}

/** One bar of the funnel: how many got this far, and what the step lost. */
export type FunnelStep = {
  stage: OnboardingStage;
  reached: number;
  /** Share of everyone who started, 0–1. */
  ofStart: number;
  /** Lost between the previous step and this one (0 for the first). */
  lostBefore: number;
  /** That loss as a share of the previous step, 0–1. */
  lostBeforeRate: number;
};

export function funnelSteps(
  stats: Pick<AdminOnboardingStats, "started" | "funnel">,
): FunnelStep[] {
  const reached = new Map(stats.funnel.map((f) => [f.stage, f.count]));
  // The first step is everyone who started, whatever the funnel row says.
  const counts = ONBOARDING_STAGES.map((s, i) =>
    i === 0 ? Math.max(stats.started, reached.get(s) ?? 0) : (reached.get(s) ?? 0),
  );
  return ONBOARDING_STAGES.map((stage, i) => {
    const here = counts[i];
    const before = i === 0 ? here : counts[i - 1];
    const lost = Math.max(0, before - here);
    return {
      stage,
      reached: here,
      ofStart: counts[0] ? here / counts[0] : 0,
      lostBefore: i === 0 ? 0 : lost,
      lostBeforeRate: i === 0 || !before ? 0 : lost / before,
    };
  });
}

/**
 * The step that loses the most people — where a fix would help most. Null
 * when nobody was lost anywhere.
 */
export function biggestLeak(steps: FunnelStep[]): FunnelStep | null {
  let worst: FunnelStep | null = null;
  for (const s of steps) {
    if (s.lostBefore > 0 && (!worst || s.lostBefore > worst.lostBefore)) worst = s;
  }
  return worst;
}

/** The stage people lost at `step` were stopped at: the one before it. */
export function stoppedStageFor(step: OnboardingStage): OnboardingStage {
  return ONBOARDING_STAGES[Math.max(0, ONBOARDING_STAGES.indexOf(step) - 1)];
}

/** « +3 », « −2 », « = » against the previous window; null without one. */
export function deltaLabel(current: number, previous: number | undefined): string | null {
  if (previous === undefined) return null;
  const d = current - previous;
  if (d === 0) return "=";
  return d > 0 ? `+${d}` : `−${Math.abs(d)}`;
}
