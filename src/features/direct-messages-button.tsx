import { cn } from "#/lib/utils";
import { Button } from "#/components/ui/button";
import { Send } from "lucide-react";
import { useState } from "react";

export const DirectMessagesButton = ({
  className,
}: Readonly<{ className?: string }>) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn("h-9 justify-start gap-2 px-3 cursor-pointer", className)}
        variant="default"
      >
        <Send className="size-4" />
        <span>Direct messages</span>
      </Button>

      <div></div>
    </>
  );
};
