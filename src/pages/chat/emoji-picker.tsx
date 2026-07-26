import { IconMoodSmile } from "@tabler/icons-react";

import { Button } from "#/components/ui/button";
import { NativeEmojiPicker } from "#/components/native-emoji-picker";
import { cn } from "#/lib/utils";

type Props = Readonly<{
  onPick: (emoji: string) => void;
  className?: string;
}>;

export function EmojiPicker({ onPick, className }: Props) {
  return (
    <NativeEmojiPicker
      onPick={onPick}
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("size-9 shrink-0 rounded-full", className)}
          aria-label="Insert emoji"
        >
          <IconMoodSmile className="size-5" />
        </Button>
      }
    />
  );
}
