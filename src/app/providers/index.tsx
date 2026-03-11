import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider } from "#/components/theme-provider";
import { TooltipProvider } from "#/components/ui/tooltip";
import { Toaster } from "#/components/ui/sonner";

const queryClient = new QueryClient();

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
