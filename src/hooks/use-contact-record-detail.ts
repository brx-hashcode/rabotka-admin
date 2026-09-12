import { useQuery } from "@tanstack/react-query";
import { getContactRecordById } from "#/lib/api/contact-records-controller";

export function useContactRecordDetail(id: string) {
  const query = useQuery({
    queryKey: ["admin", "contact-records", "detail", id],
    queryFn: () => getContactRecordById(id),
    enabled: Boolean(id),
  });

  return {
    record: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
