import { useCallback, useState } from "react";

type Item = { id: string; name: string };

export function useSelectedItems<T extends Item>(initialItems: T[] = []) {
  const [items, setItems] = useState<T[]>(initialItems);

  const toggle = useCallback((item: T) => {
    setItems((prev) =>
      prev.some((v) => v.id === item.id)
        ? prev.filter((v) => v.id !== item.id)
        : [...prev, item],
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const reset = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  const getIds = useCallback(() => items.map((item) => item.id), [items]);

  return {
    items,
    toggle,
    remove,
    reset,
    getIds,
  };
}
