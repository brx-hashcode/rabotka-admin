import { Plus, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { cn } from "#/lib/utils";
import { initials } from "../utils";

type AvatarPickerProps<T extends { id: string; name: string }> = {
  value: T[];
  onRemove: (id: string) => void;
  onAdd: () => void;
  getImage?: (item: T) => string | null | undefined;
  label: string;
};

export function AvatarPicker<T extends { id: string; name: string }>({
  value,
  onRemove,
  onAdd,
  getImage,
  label,
}: Readonly<AvatarPickerProps<T>>) {
  return (
    <div className="flex items-center gap-2 flex-wrap min-h-9">
      {value.length === 0 && <span />}
      {value.map((item) => (
        <div
          key={item.id}
          className="relative group/avatar-item"
          title={item.name}
        >
          <Avatar className="size-8 ring-2 ring-background">
            {getImage?.(item) && (
              <AvatarImage
                src={getImage(item)!}
                alt={item.name}
                className="object-cover"
              />
            )}
            <AvatarFallback className="text-xs bg-muted">
              {initials(item.name)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="absolute cursor-pointer -top-1 -right-1 size-4 rounded-full bg-destructive text-destructive-foreground items-center justify-center hidden group-hover/avatar-item:flex z-10"
          >
            <X className="size-2.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="cursor-pointer size-8 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
        title={`Add ${label}`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
