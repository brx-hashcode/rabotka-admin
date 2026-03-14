import * as React from "react";
import { Link, useRouter } from "@tanstack/react-router";

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

export type LayoutBreadcrumb = Readonly<{
  label: string;
  href?: string;
  back?: true;
}>;

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
  const router = useRouter();
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
                {breadcrumbs.map((item, i) => {
                  const isLast = i === breadcrumbs.length - 1;

                  let crumb: React.ReactNode;
                  if (isLast) {
                    crumb = <BreadcrumbPage>{item.label}</BreadcrumbPage>;
                  } else if (item.back) {
                    crumb = (
                      <BreadcrumbLink
                        className="cursor-pointer"
                        onClick={() => router.history.back()}
                      >
                        {item.label}
                      </BreadcrumbLink>
                    );
                  } else {
                    crumb = (
                      <BreadcrumbLink asChild>
                        <Link to={item.href ?? "/"}>{item.label}</Link>
                      </BreadcrumbLink>
                    );
                  }

                  return (
                    <React.Fragment key={`${item.label}-${i}`}>
                      <BreadcrumbItem className="inline-flex items-center gap-1.5">
                        {crumb}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        ) : null}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 px-4 lg:px-6">
            {renderPageHeader()}
            <div className="pb-6">{children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
