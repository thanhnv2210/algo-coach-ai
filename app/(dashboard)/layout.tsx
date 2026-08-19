import { Sidebar } from "@/components/nav/sidebar"
import { MobileNav } from "@/components/nav/mobile-nav"

// Phase 2: restore force-dynamic when DB calls are added
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileNav />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
