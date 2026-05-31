"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  ListChecks,
  BrainCircuit,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { ThemeToggle } from "@/components/nav/theme-toggle"
import { useTheme, type FontSize } from "@/components/theme-provider"

const FONT_SIZES: { value: FontSize; label: string }[] = [
  { value: "small",   label: "S" },
  { value: "default", label: "M" },
  { value: "large",   label: "L" },
]

const navItems = [
  { href: "/topics",    label: "Topics",     icon: BookOpen,        phase: 1 },
  { href: "/",          label: "Dashboard",  icon: LayoutDashboard, phase: 2 },
  { href: "/questions", label: "Questions",  icon: ListChecks,      phase: 2 },
  { href: "/ai-coach",  label: "AI Coach",   icon: BrainCircuit,    phase: 2 },
  { href: "/profile",   label: "Profile",    icon: User,            phase: 2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const { fontSize, setFontSize } = useTheme()

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          {/* BST icon — inline svg */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-primary shrink-0">
            <circle cx="9" cy="3"  r="2.5" fill="currentColor" />
            <circle cx="4" cy="13" r="2.5" fill="currentColor" />
            <circle cx="14" cy="13" r="2.5" fill="currentColor" />
            <line x1="9" y1="5.5" x2="4"  y2="10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="9" y1="5.5" x2="14" y2="10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="font-semibold text-sm text-foreground">AlgoCoach AI</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, phase }) => {
          const isActive = href === "/topics"
            ? pathname === "/topics" || pathname.startsWith("/topics/")
            : pathname === href
          const isComingSoon = phase > 1

          if (isComingSoon) {
            return (
              <div
                key={href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-faint cursor-not-allowed select-none"
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
                <span className="ml-auto text-[10px] text-faint/60 font-normal">soon</span>
              </div>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-subtle hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-faint">Size</span>
          <div className="flex gap-1 ml-auto">
            {FONT_SIZES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFontSize(value)}
                className={cn(
                  "w-6 h-6 rounded text-xs font-medium transition-colors",
                  fontSize === value
                    ? "bg-primary/20 text-primary"
                    : "text-faint hover:text-foreground hover:bg-subtle"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-faint">AlgoCoach AI</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
