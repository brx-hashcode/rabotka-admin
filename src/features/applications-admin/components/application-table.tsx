import type { TableHeaderToolbarFilterOption } from "#/components/table";
import {
  APPLICATION_STATUS_LABELS,
  PENALTY_APPLIED_LABELS,
} from "#/lib/status-labels";

export const applicationStatusOptions: readonly TableHeaderToolbarFilterOption[] =
  (Object.entries(APPLICATION_STATUS_LABELS) as [string, string][]).map(
    ([value, label]) => ({ value, label }),
  );

export const penaltyAppliedOptions: readonly TableHeaderToolbarFilterOption[] =
  (Object.entries(PENALTY_APPLIED_LABELS) as [string, string][]).map(
    ([value, label]) => ({ value, label }),
  );
