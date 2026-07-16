export const dynamic = 'force-dynamic'
import { Sidebar } from '@/components/sidebar'
import { Spotlight } from '@/components/spotlight'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      {/* Ambient depth layers */}
      <div className="app-aurora" aria-hidden />
      <div className="app-grid"   aria-hidden />
      <div className="app-blob-1" aria-hidden />
      <div className="app-blob-2" aria-hidden />
      <Spotlight />
      <Sidebar />
      <main className="app-main">
        {children}
      </main>
    </div>
  )
}
