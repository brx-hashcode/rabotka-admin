export function GraphLegend() {
  return (
    <div className="bg-card shadow-soft flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg px-3 py-2 text-xs">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-[#6366f1]" />
        Recruteur
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-[#10b981]" />
        Travailleur
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-6 bg-[#94a3b8]" />
        Mission réalisée
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0 w-6 border-t border-dashed border-[#cbd5e1]" />
        Candidature sans suite
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0 w-6 border-t-2 border-dotted border-[#f59e0b]" />
        Contact payé
      </span>
      <span className="text-muted-foreground">
        Taille = nombre de connexions
      </span>
      {/* Zoom is opt-in so the canvas doesn't trap the page scroll — say so. */}
      <span className="text-muted-foreground ml-auto">
        Glisser pour déplacer · ⌘/Ctrl + molette pour zoomer
      </span>
    </div>
  );
}
