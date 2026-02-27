import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "auto";

function getInitialMode(): ThemeMode {
  if (globalThis.window === undefined) {
    return "auto";
  }

  const stored = globalThis.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark" || stored === "auto") {
    return stored;
  }

  return "auto";
}

const applyThemeMode = (mode: ThemeMode) => {
  const prefersDark = globalThis.window.matchMedia("(prefers-color-scheme: dark)").matches;
  let resolved: "light" | "dark";
  if (mode === "auto") {
    resolved = prefersDark ? "dark" : "light";
  } else {
    resolved = mode;
  }

  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(resolved);

  if (mode === "auto") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = mode;
  }

  document.documentElement.style.colorScheme = resolved;
};

export const ThemeToggle = () => {
  const [mode, setMode] = useState<ThemeMode>("auto");

  useEffect(() => {
    const initialMode = getInitialMode();
    setMode(initialMode);
    applyThemeMode(initialMode);
  }, []);

  useEffect(() => {
    if (mode !== "auto") {
      return;
    }

    const media = globalThis.window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemeMode("auto");

    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
    };
  }, [mode]);

  function getNextMode(): ThemeMode {
    if (mode === "light") return "dark";
    if (mode === "dark") return "auto";
    return "light";
  }

  function toggleMode() {
    const nextMode = getNextMode();
    setMode(nextMode);
    applyThemeMode(nextMode);
    globalThis.localStorage.setItem("theme", nextMode);
  }

  const label =
    mode === "auto"
      ? "Theme mode: auto (system). Click to switch to light mode."
      : `Theme mode: ${mode}. Click to switch mode.`;

  function getDisplayLabel(): string {
    if (mode === "auto") return "Auto";
    if (mode === "dark") return "Dark";
    return "Light";
  }
  const displayLabel = getDisplayLabel();

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className="rounded-full border border-(--chip-line) bg-(--chip-bg) px-3 py-1.5 text-sm font-semibold text-(--sea-ink) shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5"
    >
      {displayLabel}
    </button>
  );
};
