import type { ChartConfig } from "#/components/ui/chart";

export type JobStatus =
  | "ACTIVE"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

/** Lifecycle order — how the legend and tooltips list them. */
export const JOB_STATUSES: JobStatus[] = [
  "ACTIVE",
  "PARTIALLY_FILLED",
  "FILLED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
];

/**
 * Bottom-to-top order in a stacked chart. Not the lifecycle order on purpose:
 * neighbours in a stack must stay distinguishable for colour-blind readers,
 * and of the 536 orders that pass the dataviz validator in both themes this
 * one has the best worst pair (CVD ΔE 8.4, normal ΔE 19.8) — the lifecycle
 * order puts Active beside Partially filled, which collapse on the dark card.
 */
export const JOB_STATUS_STACK_ORDER: JobStatus[] = [
  "COMPLETED",
  "ACTIVE",
  "FILLED",
  "IN_PROGRESS",
  "EXPIRED",
  "PARTIALLY_FILLED",
  "CANCELLED",
];

/**
 * One colour per status, everywhere a job status is charted, so a status reads
 * the same in every chart. The reference categorical steps from the dataviz
 * palette, mapped by meaning (active blue, completed green, cancelled red…),
 * with a separate step per theme. The previous set put Filled and Expired at
 * two near-identical oranges, and Cancelled beside Expired at ΔE 0.6 for
 * deuteranopes.
 */
export const JOB_STATUS_STYLE: Record<
  JobStatus,
  { label: string; light: string; dark: string }
> = {
  ACTIVE: { label: "Active", light: "#2a78d6", dark: "#3987e5" },
  PARTIALLY_FILLED: { label: "Partially filled", light: "#4a3aa7", dark: "#9085e9" },
  FILLED: { label: "Filled", light: "#eb6834", dark: "#d95926" },
  IN_PROGRESS: { label: "In progress", light: "#1baf7a", dark: "#199e70" },
  COMPLETED: { label: "Completed", light: "#008300", dark: "#008300" },
  CANCELLED: { label: "Cancelled", light: "#e34948", dark: "#e66767" },
  EXPIRED: { label: "Expired", light: "#eda100", dark: "#c98500" },
};

/** The ChartContainer config: exposes `--color-<STATUS>` per theme. */
export const jobStatusChartConfig = Object.fromEntries(
  JOB_STATUSES.map((s) => [
    s,
    {
      label: JOB_STATUS_STYLE[s].label,
      theme: { light: JOB_STATUS_STYLE[s].light, dark: JOB_STATUS_STYLE[s].dark },
    },
  ]),
) satisfies ChartConfig;
