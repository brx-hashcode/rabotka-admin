import type { TableHeaderToolbarFilterOption } from "#/components/table";

export const entityTypeOptions: readonly TableHeaderToolbarFilterOption[] = [
  { value: "Profile", label: "Profile" },
  { value: "PaymentRequest", label: "Payment Request" },
  { value: "Application", label: "Application" },
  { value: "JobOffer", label: "Job Offer" },
  { value: "User", label: "User" },
  { value: "KYC", label: "KYC" },
  { value: "Wallet", label: "Wallet" },
  { value: "Penalty", label: "Penalty" },
];
