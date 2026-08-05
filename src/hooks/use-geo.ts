import { useQuery } from "@tanstack/react-query";
import { getCities, getCountries } from "#/lib/api/geo-controller";

/**
 * A reference list that does not change within a session, so both hooks cache
 * for the whole session rather than the default 0ms — otherwise the 252-country
 * list is re-fetched every time a profile detail page mounts.
 */
const REFERENCE_DATA_STALE_TIME = Number.POSITIVE_INFINITY;

export function useCountries() {
  return useQuery({
    queryKey: ["geo", "countries"],
    queryFn: getCountries,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

/** Cities of `countryCode`, idle until a country is chosen. */
export function useCities(countryCode: string | null | undefined) {
  return useQuery({
    queryKey: ["geo", "cities", countryCode],
    queryFn: () => getCities(countryCode!),
    enabled: Boolean(countryCode),
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}
