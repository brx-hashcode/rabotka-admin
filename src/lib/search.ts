/**
 * Case- and accent-insensitive text matching.
 *
 * French copy is full of diacritics — "Maraîchage", "Secrétariat", "Revêtement"
 * — and nobody reaches for the accented key while typing a filter. A plain
 * `includes` on the raw strings makes those rows unreachable by the spelling
 * every user actually types.
 */

/**
 * Lower-cased and stripped of diacritics, so "Maraichage" matches "Maraîchage".
 *
 * NFD splits an accented character into its base letter plus a combining mark,
 * which `\p{Diacritic}` then removes — so this covers every accent in the data
 * rather than a hand-written é/è/à table that the next language would outgrow.
 */
export function fold(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Whether every word of the query appears somewhere in the haystack.
 *
 * Per-word rather than one substring, so word order and the filler between
 * words stop mattering: "vente viande" finds "Boucherie & Vente de viande",
 * and "secretariat admin" finds "Administratif & Secrétariat". Both are things
 * a user types when they half-remember a name, and both miss under `includes`.
 *
 * AND, not OR — every word has to land. OR would return most of the list for a
 * two-word query and make the filter useless.
 *
 * @param query    what the user typed
 * @param haystack the fields to search, joined; nullish entries are ignored
 */
export function matchesSearch(
  query: string,
  ...haystack: (string | null | undefined)[]
): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const target = fold(haystack.filter(Boolean).join(" "));
  return words.every((word) => target.includes(word));
}
