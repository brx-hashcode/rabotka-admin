import { useState } from "react";
import { IconMoodSmile } from "@tabler/icons-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

/** Native (OS-rendered) emojis grouped by category — no external dependency. */
const EMOJI_GROUPS: ReadonlyArray<{ label: string; emojis: readonly string[] }> =
  [
    {
      label: "Smileys",
      emojis: [
        "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎", "🤩", "🥳",
        "🙂", "😉", "😇", "🥰", "😋", "😜", "🤪", "🤔", "😐", "😴",
        "😅", "😆", "🙃", "😬", "😢", "😭", "😡", "🥺", "😱", "🤗",
      ],
    },
    {
      label: "Gestures",
      emojis: [
        "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤙", "👏", "🙌", "🙏",
        "💪", "👋", "🤝", "👊", "✊", "☝️", "👇", "👉", "👈", "🫡",
      ],
    },
    {
      label: "Hearts",
      emojis: [
        "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
        "❣️", "💕", "💞", "💖", "💘", "💝",
      ],
    },
    {
      label: "Objects",
      emojis: [
        "🔥", "⭐", "✨", "🎉", "🎊", "💯", "✅", "❌", "❓", "❗",
        "📌", "📎", "📝", "📅", "💼", "📞", "📧", "💰", "🏆", "🎯",
        "⏰", "🔔", "📢", "💡",
      ],
    },
    {
      label: "Fun",
      emojis: [
        "🌟", "🌈", "☀️", "🌙", "⚡", "❄️", "🌸", "🌹", "🌿", "🍀",
        "🐱", "🐶", "🎂", "☕", "🍕", "🍔", "🍻", "🎁",
      ],
    },
  ];

type Props = Readonly<{
  onPick: (emoji: string) => void;
  className?: string;
}>;

export function EmojiPicker({ onPick, className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("size-9 shrink-0 rounded-full", className)}
          aria-label="Insert emoji"
        >
          <IconMoodSmile className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-72 p-2"
      >
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {group.emojis.map((emoji, i) => (
                  <button
                    key={`${emoji}-${i}`}
                    type="button"
                    onClick={() => onPick(emoji)}
                    className="flex size-8 items-center justify-center rounded text-xl transition-colors hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
