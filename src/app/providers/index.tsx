import type { ReactNode } from "react"

import { ThemeProvider } from "#/components/theme-provider"
import { TooltipProvider } from "#/components/ui/tooltip"

type ProvidersProps = Readonly<{
  children: ReactNode
}>

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  )
}
