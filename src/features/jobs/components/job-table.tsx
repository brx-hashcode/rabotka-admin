import type { TableHeaderToolbarFilterOption } from "#/components/table";
import {
  JOB_OFFER_STATUS_LABELS,
  PAYMENT_FLOW_LABELS,
} from "#/lib/status-labels";

export const jobStatusOptions: readonly TableHeaderToolbarFilterOption[] = (
  Object.entries(JOB_OFFER_STATUS_LABELS) as [string, string][]
).map(([value, label]) => ({ value, label }));

export const paymentFlowOptions: readonly TableHeaderToolbarFilterOption[] = (
  Object.entries(PAYMENT_FLOW_LABELS) as [string, string][]
).map(([value, label]) => ({ value, label }));
