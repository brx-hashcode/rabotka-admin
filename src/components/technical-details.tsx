import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "#/lib/utils";

export type TechnicalRow = {
  label: string;
  value: ReactNode;
};


export function TechnicalDetails({
  rows,
  children,
  className,
}: Readonly<{
  rows: readonly TechnicalRow[];
  children?: ReactNode;
  className?: string;
}>) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("bg-muted/50 rounded-md", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium transition-colors"
      >
        Technical details (for the tech team)
        <ChevronDown
          aria-hidden
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="space-y-2 px-3 pb-3">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[9rem_1fr] gap-2 text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="min-w-0 break-all font-mono">{row.value ?? "—"}</span>
            </div>
          ))}
          {children}
        </div>
      )}
    </div>
  );
}
