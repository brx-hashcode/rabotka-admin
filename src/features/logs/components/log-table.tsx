import type { TableHeaderToolbarFilterOption } from "#/components/table";

export const entityTypeOptions: readonly TableHeaderToolbarFilterOption[] = [
  { value: "Profile", label: "Profile" },
  { value: "Application", label: "Application" },
  { value: "JobOffer", label: "Job Offer" },
  { value: "Payment", label: "Payment" },
  { value: "User", label: "User" },
  { value: "KYC", label: "KYC" },
  { value: "Wallet", label: "Wallet" },
  { value: "Penalty", label: "Penalty" },
];
