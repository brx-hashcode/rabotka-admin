import { parseAsInteger, parseAsString, parseAsArrayOf } from "nuqs";
import { appConfig } from "#/config";

export const defaultWalletTableLimit = appConfig.defaultPaginationLimit;

export const walletPaymentsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(defaultWalletTableLimit),
  q: parseAsString.withDefault(""),
  pay_type: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  pay_status: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  pay_method: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  created_from: parseAsString.withDefault(""),
  created_to: parseAsString.withDefault(""),
};

export const walletTransactionsParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(defaultWalletTableLimit),
  q: parseAsString.withDefault(""),
  tx_type: parseAsArrayOf(parseAsString).withDefault([] as string[]),
  created_from: parseAsString.withDefault(""),
  created_to: parseAsString.withDefault(""),
  deleted: parseAsArrayOf(parseAsString).withDefault([] as string[]),
};
