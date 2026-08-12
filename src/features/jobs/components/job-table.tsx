import type { TableHeaderToolbarFilterOption } from "#/components/table";
import { EMPLOYMENT_TYPE_LABELS } from "#/lib/employment-type";
import {
  JOB_OFFER_STATUS_LABELS,
  PAYMENT_FLOW_LABELS,
} from "#/lib/status-labels";

export const jobStatusOptions: readonly TableHeaderToolbarFilterOption[] =
  Object.entries(JOB_OFFER_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export const paymentFlowOptions: readonly TableHeaderToolbarFilterOption[] =
  Object.entries(PAYMENT_FLOW_LABELS).map(([value, label]) => ({ value, label }));

/**
 * Labelled from EMPLOYMENT_TYPE_LABELS, which is uppercase on purpose, so the
 * option reads exactly as the Type column renders it.
 */
export const employmentTypeOptions: readonly TableHeaderToolbarFilterOption[] =
  Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));
