import { Sidebar } from "@/components/nav/sidebar"
import { MobileNav } from "@/components/nav/mobile-nav"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // overflow-hidden removed from both containers — iOS WebKit breaks fixed-child
    // touch events inside overflow:hidden ancestors (known WebKit bug)
    <div className="flex h-dvh">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <MobileNav />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
