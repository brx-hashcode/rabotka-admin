import * as React from "react";
import { Link } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "#/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar";
import { AppSidebar, SiteHeader } from "#/layouts";

export type LayoutBreadcrumb = Readonly<{ label: string; href?: string }>;

type LayoutProps = Readonly<{
  children: React.ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: readonly LayoutBreadcrumb[];
}>;

const SIDEBAR_STYLE = {
  "--sidebar-width": "calc(var(--spacing) * 72)",
  "--header-height": "calc(var(--spacing) * 12)",
} as React.CSSProperties;

export function Layout({
  children,
  title,
  description,
  breadcrumbs,
}: LayoutProps) {
  function renderPageHeader() {
    const hasBreadcrumbs = (breadcrumbs?.length ?? 0) > 0;
    if (hasBreadcrumbs && description != null) {
      return <p className="py-2 text-muted-foreground">{description}</p>;
    }
    if (!hasBreadcrumbs && (title != null || description != null)) {
      return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {title != null && <h1 className="text-2xl font-semibold">{title}</h1>}
          {description != null && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      );
    }
    return null;
  }

  return (
    <SidebarProvider style={SIDEBAR_STYLE}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {breadcrumbs?.length ? (
          <div className="border-b px-4 py-2 lg:px-6">
            <Breadcrumb>
              <BreadcrumbList className="gap-2 text-foreground">
                {breadcrumbs.map((item, i) => (
                  <React.Fragment key={`${item.label}-${i}`}>
                    <BreadcrumbItem className="inline-flex items-center gap-1.5">
                      {i < breadcrumbs.length - 1 && item.href != null ? (
                        <BreadcrumbLink asChild>
                          <Link to={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {i < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        ) : null}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 px-4 lg:px-6">
            {renderPageHeader()}
            <div className="mt-16">{children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
