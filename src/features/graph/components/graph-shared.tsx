/** Up to two letters, matching how the Avatar component builds its fallback. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return `${first}${second}`.toUpperCase();
}

/** A floating icon button over the graph, the same in 2D and 3D. */
export function GraphControl({
  label,
  onClick,
  children,
}: Readonly<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="bg-background/90 text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md border shadow-xs backdrop-blur transition-colors"
    >
      {children}
    </button>
  );
}
