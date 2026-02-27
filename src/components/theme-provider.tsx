import * as React from "react"

type Theme = "light" | "dark" | "system"

type ThemeProviderProps = Readonly<{
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}>

function getSystemTheme(): "light" | "dark" {
  if (globalThis.window === undefined) return "light"
  return globalThis.window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.remove("light", "dark")
  document.documentElement.classList.add(theme)
  document.documentElement.style.colorScheme = theme
}

const ThemeContext = React.createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
} | null>(null)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (globalThis.window === undefined) return defaultTheme
    const stored = globalThis.localStorage.getItem(storageKey) as Theme | null
    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : defaultTheme
  })

  const resolvedTheme =
    theme === "system" ? getSystemTheme() : theme

  React.useEffect(() => {
    const root = document.documentElement
    if (theme === "system") {
      delete root.dataset.theme
      applyTheme(getSystemTheme())
    } else {
      root.dataset.theme = theme
      applyTheme(theme)
    }
  }, [theme])

  React.useEffect(() => {
    if (theme !== "system") return
    const media = globalThis.window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyTheme(getSystemTheme())
    media.addEventListener("change", handler)
    return () => media.removeEventListener("change", handler)
  }, [theme])

  const setTheme = React.useCallback(
    (value: Theme) => {
      setThemeState(value)
      globalThis.localStorage.setItem(storageKey, value)
    },
    [storageKey]
  )

  const value = React.useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
