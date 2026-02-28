import type { ReactNode } from "react";

type TableHeaderProps = Readonly<{
  children?: ReactNode;
}>;

export function TableHeader({ children }: TableHeaderProps) {
  if (children == null) return null;
  return (
    <div className="flex flex-col gap-2 px-4 py-2">
      {children}
    </div>
  );
}
