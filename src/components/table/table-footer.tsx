import type { ReactNode } from "react";

type TableFooterProps = Readonly<{
  children?: ReactNode;
}>;

export function TableFooter({ children }: TableFooterProps) {
  if (children == null) return null;
  return (
    <div className="flex w-full min-w-0 items-center justify-between py-3">
      {children}
    </div>
  );
}
