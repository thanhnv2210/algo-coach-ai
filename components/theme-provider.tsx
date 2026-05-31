"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type Theme = "light" | "dark"
export type FontSize = "small" | "default" | "large"

type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  fontSize: FontSize
  setFontSize: (s: FontSize) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  fontSize: "default",
  setFontSize: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")
  const [fontSize, setFontSizeState] = useState<FontSize>("default")

  useEffect(() => {
    const storedTheme = localStorage.getItem("algo-coach-ai:theme") as Theme | null
    const resolvedTheme: Theme = storedTheme === "light" ? "light" : "dark"
    setThemeState(resolvedTheme)
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark")

    const storedSize = localStorage.getItem("algo-coach-ai:font-size") as FontSize | null
    const resolvedSize: FontSize =
      storedSize === "small" || storedSize === "large" ? storedSize : "default"
    setFontSizeState(resolvedSize)
    document.documentElement.setAttribute("data-font-size", resolvedSize)
  }, [])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem("algo-coach-ai:theme", t)
    document.documentElement.classList.toggle("dark", t === "dark")
  }

  function setFontSize(s: FontSize) {
    setFontSizeState(s)
    localStorage.setItem("algo-coach-ai:font-size", s)
    document.documentElement.setAttribute("data-font-size", s)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  )
}
