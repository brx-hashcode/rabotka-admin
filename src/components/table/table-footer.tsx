import type { ReactNode } from "react";

type TableFooterProps = Readonly<{
  children?: ReactNode;
}>;

export function TableFooter({ children }: TableFooterProps) {
  if (children == null) return null;
  return (
    <div className="flex items-center justify-between py-3">{children}</div>
  );
}
