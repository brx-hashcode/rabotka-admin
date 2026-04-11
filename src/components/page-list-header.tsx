import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

type PageListHeaderProps = Readonly<{
  title: string;
  description: string;
  /** Right-aligned actions (e.g. primary button) */
  actions?: ReactNode;
  className?: string;
}>;

/**
 * Page title + description row aligned with Job Categories / Documents:
 * bold title, muted description, optional actions on the right.
 */
export function PageListHeader({
  title,
  description,
  actions,
  className,
}: PageListHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex items-center justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
      </div>
      {actions == null ? null : (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
