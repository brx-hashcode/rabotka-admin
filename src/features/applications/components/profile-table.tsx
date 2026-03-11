import type { TableHeaderToolbarFilterOption } from "#/components/table";
import {
  ACCOUNT_STATUS_LABELS,
  PROFILE_TYPE_LABELS,
  VERIFICATION_STATUS_LABELS,
} from "#/lib/status-labels";

export const statusOptions: readonly TableHeaderToolbarFilterOption[] = (
  Object.entries(ACCOUNT_STATUS_LABELS) as [string, string][]
).map(([value, label]) => ({ value, label }));

export const profileTypeOptions: readonly TableHeaderToolbarFilterOption[] = (
  Object.entries(PROFILE_TYPE_LABELS) as [string, string][]
).map(([value, label]) => ({ value, label }));

export const whatsappStatusOptions: readonly TableHeaderToolbarFilterOption[] = [
  { value: "true", label: "Connected" },
  { value: "false", label: "Disconnected" },
];

export const verificationStatusOptions: readonly TableHeaderToolbarFilterOption[] =
  (
    Object.entries(VERIFICATION_STATUS_LABELS) as [string, string][]
  ).map(([value, label]) => ({ value, label }));
