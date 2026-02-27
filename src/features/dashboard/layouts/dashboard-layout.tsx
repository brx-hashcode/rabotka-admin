import * as React from "react"

import { AppSidebar, SiteHeader } from "#/features/dashboard/components"
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar"

type DashboardLayoutProps = Readonly<{
  children: React.ReactNode
}>

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
