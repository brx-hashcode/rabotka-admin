import { useState } from "react";

const STORAGE_KEY = "sidebar:hidden-documents";

export function useHiddenDocuments() {
  const [hidden, setHidden] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  const hide = (name: string) => {
    setHidden((prev) => {
      const next = prev.includes(name) ? prev : [...prev, name];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHidden([]);
  };

  const isVisible = (name: string) => !hidden.includes(name);

  return { isVisible, hide, reset, hasHidden: hidden.length > 0 };
}
