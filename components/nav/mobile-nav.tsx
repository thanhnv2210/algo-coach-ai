"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Menu, X,
  LayoutDashboard, BookOpen, ListChecks, BrainCircuit, User, FlaskConical,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"

const navItems = [
  { href: "/",          label: "Dashboard",  icon: LayoutDashboard },
  { href: "/topics",    label: "Topics",     icon: BookOpen },
  { href: "/questions", label: "Questions",  icon: ListChecks },
  { href: "/java-lab",  label: "Java Lab",   icon: FlaskConical },
  { href: "/ai-coach",  label: "AI Coach",   icon: BrainCircuit },
  { href: "/profile",   label: "Profile",    icon: User },
]

function BstIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-primary shrink-0">
      <circle cx="9"  cy="3"  r="2.5" fill="currentColor" />
      <circle cx="4"  cy="13" r="2.5" fill="currentColor" />
      <circle cx="14" cy="13" r="2.5" fill="currentColor" />
      <line x1="9" y1="5.5" x2="4"  y2="10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9" y1="5.5" x2="14" y2="10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  // Portal requires the DOM to be available
  useEffect(() => { setMounted(true) }, [])

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Prevent body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const drawer = mounted ? createPortal(
    <>
      {/* Backdrop — rendered at body level, no overflow-hidden ancestor */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 transition-opacity duration-200 md:hidden",
          open ? "opacity-100 z-40" : "opacity-0 pointer-events-none -z-10"
        )}
        style={{ touchAction: "manipulation" }}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Drawer — also at body level */}
      <div
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[80vw] max-w-xs bg-card border-r border-border",
          "flex flex-col transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <BstIcon />
            <span className="font-semibold text-sm text-foreground">AlgoCoach AI</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{ touchAction: "manipulation" }}
            className="p-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/topics"
                ? pathname === "/topics" || pathname.startsWith("/topics/")
                : href === "/questions"
                ? pathname === "/questions" || pathname.startsWith("/practice/")
                : href === "/"
                ? pathname === "/"
                : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
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
      </div>
    </>,
    document.body
  ) : null

  return (
    <>
      {/* Top bar — stays in normal DOM flow */}
      <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <BstIcon />
          <span className="font-semibold text-sm text-foreground">AlgoCoach AI</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ touchAction: "manipulation" }}
          className="p-2.5 -mr-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="mobile-drawer"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {drawer}
    </>
  )
}
