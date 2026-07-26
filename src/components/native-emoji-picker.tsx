import { useState, type ReactNode } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import { cn } from "#/lib/utils";

/** Native (OS-rendered) emojis grouped by category — no external dependency. */
export const EMOJI_GROUPS: ReadonlyArray<{
  label: string;
  emojis: readonly string[];
}> = [
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
    label: "Work",
    emojis: [
      "🧹", "🏠", "🏢", "🚚", "🍳", "🍽️", "👷", "🔧", "🔨", "⚙️",
      "🛒", "📦", "🏗️", "🧰", "🚛", "🛵", "🚗", "✂️", "🧺", "🪣",
      "🌿", "🌱", "🪴", "💼", "🖥️", "📱", "🖨️", "🗂️", "🔐", "🛡️",
      "👮", "🏪", "🏬", "🏭", "🧑‍🍳", "🧑‍🔧", "🧑‍💼", "🧑‍🌾", "🧑‍💻", "🧑‍⚕️",
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
      "📌", "📎", "📝", "📅", "📞", "📧", "💰", "🏆", "🎯", "⏰",
      "🔔", "📢", "💡", "🔑", "📋", "📊", "📐", "🔦",
    ],
  },
  {
    label: "Fun",
    emojis: [
      "🌟", "🌈", "☀️", "🌙", "⚡", "❄️", "🌸", "🌹", "🍀", "🌍",
      "🐱", "🐶", "🎂", "☕", "🍕", "🍔", "🍻", "🎁",
    ],
  },
];

type Props = Readonly<{
  /** The clickable element that opens the picker. */
  trigger: ReactNode;
  onPick: (emoji: string) => void;
  /** Close the popover after a pick (single-select). Default false. */
  closeOnSelect?: boolean;
  /** Currently-selected emoji to highlight (single-select mode). */
  selected?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}>;

export function NativeEmojiPicker({
  trigger,
  onPick,
  closeOnSelect = false,
  selected,
  side = "top",
  align = "start",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-80 p-2">
        <div className="max-h-64 space-y-3 overflow-y-auto overflow-x-hidden pr-1">
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
                    onClick={() => {
                      onPick(emoji);
                      if (closeOnSelect) setOpen(false);
                    }}
                    className={cn(
                      "flex size-8 items-center justify-center rounded text-xl transition-colors hover:bg-muted",
                      selected === emoji && "bg-primary/15 ring-1 ring-primary",
                    )}
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
