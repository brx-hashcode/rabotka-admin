import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { is401, isExpiring } from "#/lib/auth/session";

import { ThemeProvider } from "#/components/theme-provider";
import { TooltipProvider } from "#/components/ui/tooltip";
import { Toaster } from "#/components/ui/sonner";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      // A dead session would otherwise cost ~7s of exponential backoff per
      // query before anything happened, and every other query would keep
      // retrying into a session already being torn down.
      //
      // This is a latency optimisation, not the logout mechanism: anything from
      // auth-controller.ts has already been flattened by handleError and carries
      // no statusCode. The transport-level guard has fired long before here.
      // `failureCount < 3` reproduces React Query's default exactly.
      retry: (failureCount: number, error: unknown) =>
        !is401(error) && !isExpiring() && failureCount < 3,
    },
  },
});

export function getQueryClient(): QueryClient {
  return queryClient;
}

type ProvidersProps = Readonly<{
  children: ReactNode;
}>;

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="theme">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
