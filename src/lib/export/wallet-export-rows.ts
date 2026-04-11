import type {
  AdminPaymentItem,
  AdminWalletTransactionItem,
} from "#/lib/api/wallet-controller";

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  REGISTRATION: "Registration",
  JOB_POSTING: "Job Posting",
  PENALTY: "Penalty",
  CONTACT_UNLOCK: "Contact Unlock",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  MOBILE_MONEY: "Mobile Money",
  CARD: "Card",
  OTHER: "Other",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

const TX_TYPE_LABELS: Record<string, string> = {
  CREDIT_PENALTY: "Penalty",
  CREDIT_REGISTRATION: "Registration",
  CREDIT_JOB_POSTING: "Job Posting",
  CREDIT_COMMISSION: "Commission",
  CONTACT_UNLOCK_PAYMENT: "Contact Unlock",
  WELCOME_CREDIT: "Welcome Credit",
};

function isoOrEmpty(v: string | null | undefined): string {
  return v ?? "";
}

export const PAYMENT_EXPORT_HEADERS = [
  "Profile name",
  "Profile email",
  "Type",
  "Amount (FCFA)",
  "Method",
  "Status",
  "Transaction ID",
  "Paid at (ISO)",
  "Created at (ISO)",
  "Description",
] as const;

export const TRANSACTION_EXPORT_HEADERS = [
  "ID",
  "Wallet ID",
  "Type",
  "Amount (FCFA)",
  "Reference type",
  "Reference ID",
  "Created at (ISO)",
] as const;

export function paymentItemsToStringRows(items: AdminPaymentItem[]): string[][] {
  return items.map((p) => [
    p.profileName ?? "",
    p.profileEmail ?? "",
    PAYMENT_TYPE_LABELS[p.type] ?? p.type,
    String(p.amount),
    PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod,
    PAYMENT_STATUS_LABELS[p.status] ?? p.status,
    p.transactionId,
    isoOrEmpty(p.paidAt),
    p.createdAt,
    p.description ?? "",
  ]);
}

export function paymentItemsToTypedRows(
  items: AdminPaymentItem[],
): (string | number | null)[][] {
  return items.map((p) => [
    p.profileName ?? "",
    p.profileEmail ?? "",
    PAYMENT_TYPE_LABELS[p.type] ?? p.type,
    p.amount,
    PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod,
    PAYMENT_STATUS_LABELS[p.status] ?? p.status,
    p.transactionId,
    p.paidAt,
    p.createdAt,
    p.description ?? "",
  ]);
}

export function transactionItemsToStringRows(
  items: AdminWalletTransactionItem[],
): string[][] {
  return items.map((t) => [
    t.id,
    t.walletId,
    TX_TYPE_LABELS[t.type] ?? t.type,
    String(t.amount),
    t.referenceType ?? "",
    t.referenceId ?? "",
    t.createdAt,
  ]);
}

export function transactionItemsToTypedRows(
  items: AdminWalletTransactionItem[],
): (string | number | null)[][] {
  return items.map((t) => [
    t.id,
    t.walletId,
    TX_TYPE_LABELS[t.type] ?? t.type,
    t.amount,
    t.referenceType ?? "",
    t.referenceId ?? "",
    t.createdAt,
  ]);
}
