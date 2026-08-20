"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type Theme = "light" | "dark"
export type FontSize = "small" | "default" | "large"

type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  fontSize: FontSize
  setFontSize: (s: FontSize) => void
  showEditor: boolean
  setShowEditor: (v: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  navCollapsed: boolean
  setNavCollapsed: (v: boolean) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  fontSize: "default",
  setFontSize: () => {},
  showEditor: true,
  setShowEditor: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  navCollapsed: false,
  setNavCollapsed: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")
  const [fontSize, setFontSizeState] = useState<FontSize>("default")
  const [showEditor, setShowEditorState] = useState<boolean>(true)
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(false)
  const [navCollapsed, setNavCollapsedState] = useState<boolean>(false)

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

    const storedEditor = localStorage.getItem("algo-coach-ai:show-editor")
    if (storedEditor !== null) setShowEditorState(storedEditor !== "false")

    const storedSidebar = localStorage.getItem("algo-coach-ai:sidebar-collapsed")
    if (storedSidebar !== null) setSidebarCollapsedState(storedSidebar === "true")

    const storedNav = localStorage.getItem("algo-coach-ai:nav-collapsed")
    if (storedNav !== null) setNavCollapsedState(storedNav === "true")
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

  function setShowEditor(v: boolean) {
    setShowEditorState(v)
    localStorage.setItem("algo-coach-ai:show-editor", String(v))
  }

  function setSidebarCollapsed(v: boolean) {
    setSidebarCollapsedState(v)
    localStorage.setItem("algo-coach-ai:sidebar-collapsed", String(v))
  }

  function setNavCollapsed(v: boolean) {
    setNavCollapsedState(v)
    localStorage.setItem("algo-coach-ai:nav-collapsed", String(v))
  }

  return (
    <ThemeContext.Provider value={{
      theme, setTheme,
      fontSize, setFontSize,
      showEditor, setShowEditor,
      sidebarCollapsed, setSidebarCollapsed,
      navCollapsed, setNavCollapsed,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}
