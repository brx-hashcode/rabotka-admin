import { Button } from "#/components/ui/button";
import { NativeEmojiPicker } from "#/components/native-emoji-picker";

type EmojiPickerPopoverProps = Readonly<{
  value: string;
  onChange: (emoji: string) => void;
}>;

export function EmojiPickerPopover({
  value,
  onChange,
}: EmojiPickerPopoverProps) {
  return (
    <NativeEmojiPicker
      onPick={onChange}
      selected={value}
      closeOnSelect
      side="bottom"
      align="start"
      trigger={
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full text-xl"
          aria-label="Pick an icon"
        >
          {value || <span className="text-sm text-muted-foreground">🧹</span>}
        </Button>
      }
    />
  );
}
