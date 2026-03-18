import type { TableHeaderToolbarFilterOption } from "#/components/table";
import { PENALTY_PAYMENT_STATUS_LABELS } from "#/lib/status-labels";

export const penaltyPaymentStatusOptions: readonly TableHeaderToolbarFilterOption[] =
  Object.entries(PENALTY_PAYMENT_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
