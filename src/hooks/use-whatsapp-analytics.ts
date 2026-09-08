import { parseAsString, useQueryStates } from "nuqs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getWhatsappBilling,
  getWhatsappQueue,
  getWhatsappStats,
  retryWhatsappDlqJob,
} from "#/lib/api/whatsapp-controller";

/**
 * The analytics half of the WhatsApp page.
 *
 * The date range is shared with the message table through the same URL params
 * the table already uses, so switching tabs keeps the window the reader chose
 * rather than silently resetting it.
 */

const rangeParsers = {
  created_from: parseAsString.withDefault(""),
  created_to: parseAsString.withDefault(""),
};

export function useWhatsappRange() {
  const [range] = useQueryStates(rangeParsers);
  return {
    ...(range.created_from ? { created_from: range.created_from } : {}),
    ...(range.created_to ? { created_to: range.created_to } : {}),
  };
}

export function useWhatsappStats() {
  const range = useWhatsappRange();
  return useQuery({
    queryKey: ["admin", "whatsapp", "stats", range],
    queryFn: () => getWhatsappStats(range),
  });
}

export function useWhatsappBilling(enabled = true) {
  const range = useWhatsappRange();
  return useQuery({
    queryKey: ["admin", "whatsapp", "billing", range],
    queryFn: () => getWhatsappBilling(range),
    // Meta's figures settle slowly and the endpoint is rate limited upstream;
    // the backend caches for 15 minutes, so refetching on focus buys nothing.
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    // A 503 here means the provider is not Cloud, or Graph is unreachable.
    // Neither is fixed by trying again three times.
    retry: false,
    enabled,
  });
}

export function useWhatsappQueue(enabled = true) {
  return useQuery({
    queryKey: ["admin", "whatsapp", "queue"],
    queryFn: () => getWhatsappQueue(),
    // Queue depth is the one figure on this page that is meaningful live.
    refetchInterval: enabled ? 10_000 : false,
    enabled,
  });
}

export function useRetryDlqJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => retryWhatsappDlqJob(jobId),
    onSuccess: (result) => {
      if (result.retried) {
        toast.success("Job re-queued");
      } else {
        // Not an error: the job aged out of Redis, or its payload was
        // unusable. Saying which beats a success toast over nothing happening.
        toast.warning("Nothing to retry — the job is gone or has no payload");
      }
      void queryClient.invalidateQueries({
        queryKey: ["admin", "whatsapp", "queue"],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not retry the job");
    },
  });
}
