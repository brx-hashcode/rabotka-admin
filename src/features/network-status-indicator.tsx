import { useSocketStore } from "#/stores/use-socket-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "#/components/ui/tooltip";

export function NetworkStatusIndicator() {
  const isConnected = useSocketStore((s) => s.isConnected);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 px-1">
          <span
            className={`inline-block size-2.5 rounded-full ${
              isConnected
                ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]"
                : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse"
            }`}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {isConnected ? "Connecté au serveur" : "Déconnecté du serveur"}
      </TooltipContent>
    </Tooltip>
  );
}
