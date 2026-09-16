import type { TableHeaderToolbarFilterOption } from "#/components/table";

export const entityTypeOptions: readonly TableHeaderToolbarFilterOption[] = [
  { value: "Profile", label: "Profile" },
  { value: "PaymentRequest", label: "Payment request" },
  { value: "Application", label: "Application" },
  { value: "JobOffer", label: "Job" },
  { value: "User", label: "Team member" },
  { value: "KYC", label: "Identity check (KYC)" },
  { value: "Wallet", label: "Wallet" },
  { value: "Penalty", label: "Penalty" },
];
