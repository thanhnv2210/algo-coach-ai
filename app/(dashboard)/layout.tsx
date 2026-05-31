import { Sidebar } from "@/components/nav/sidebar"

// Phase 2: restore force-dynamic when DB calls are added
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}
