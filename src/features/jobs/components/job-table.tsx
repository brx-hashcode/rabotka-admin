import type { TableHeaderToolbarFilterOption } from "#/components/table";
import { JOB_OFFER_STATUS_LABELS } from "#/lib/status-labels";

export const jobStatusOptions: readonly TableHeaderToolbarFilterOption[] =
  Object.entries(JOB_OFFER_STATUS_LABELS).map(([value, label]) => ({ value, label }));
