import { parseAsString, useQueryStates } from "nuqs";

/**
 * The window for the Finance stat cards.
 *
 * Deliberately NOT `created_from` / `created_to`: those belong to the payments
 * and transactions tables below, and the header toggle is meant to move the
 * cards without also filtering the lists and their exports.
 */
export const WALLET_STATS_FROM_KEY = "stats_from";
export const WALLET_STATS_TO_KEY = "stats_to";

const rangeParsers = {
  [WALLET_STATS_FROM_KEY]: parseAsString.withDefault(""),
  [WALLET_STATS_TO_KEY]: parseAsString.withDefault(""),
};

export function useWalletStatsRange() {
  const [range] = useQueryStates(rangeParsers);
  return {
    ...(range.stats_from ? { created_from: range.stats_from } : {}),
    ...(range.stats_to ? { created_to: range.stats_to } : {}),
  };
}
