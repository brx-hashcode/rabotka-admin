import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import { Input } from "#/components/ui/input";
import { Button } from "#/components/ui/button";

const EMOJI_LIST = [
  "🧹", "🏠", "🏢", "🚚", "🍳", "🍽️", "👷", "🔧", "🔨", "⚙️",
  "🛒", "📦", "🏗️", "🧰", "🚛", "🛵", "🚗", "✂️", "🧺", "🪣",
  "🌿", "🌱", "🪴", "💼", "📋", "📊", "🖥️", "📱", "🖨️", "🗂️",
  "🔐", "🛡️", "👮", "🚨", "🏪", "🏬", "🏭", "🧑‍🍳", "🧑‍🔧", "🧑‍💼",
  "🧑‍🌾", "🧑‍🏭", "🧑‍💻", "🧑‍🎨", "🧑‍🚒", "🧑‍⚕️", "📸", "🎥", "🎨", "✏️",
  "📝", "📐", "📏", "🔑", "🗝️", "💡", "🔦", "🪑", "🛏️", "🚿",
  "🌍", "🤝", "💰", "💳", "🏦", "📬", "📮", "🎯", "⭐", "❓",
];

type EmojiPickerPopoverProps = {
  value: string;
  onChange: (emoji: string) => void;
};

export function EmojiPickerPopover({ value, onChange }: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search
    ? EMOJI_LIST.filter((e) => e.includes(search))
    : EMOJI_LIST;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full h-10 text-xl"
          aria-label="Pick an icon"
        >
          {value || <span className="text-muted-foreground text-sm">🧹</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 h-8 text-sm"
        />
        <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
          {filtered.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onChange(emoji);
                setOpen(false);
                setSearch("");
              }}
              className="flex items-center justify-center text-xl h-8 w-8 rounded hover:bg-muted transition-colors"
            >
              {emoji}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-8 text-center text-muted-foreground text-sm py-2">
              No results
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
