'use client'
import { Bell } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/lib/supabase/use-supabase'

export function TopBar({ subtitle = "Let's plan your meals today" }: { subtitle?: string }) {
  const supabase = useSupabase()
  const [name, setName]         = useState('')
  const [initials, setInitials] = useState('U')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      const raw   = user?.user_metadata?.full_name ?? user?.email ?? 'User'
      const first = raw.split(/[\s@]/)[0]
      setName(first)
      setInitials(raw.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase())
    })
  }, [supabase])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="topbar-avatar" suppressHydrationWarning>{initials}</div>
        <div>
          <p className="topbar-greeting" suppressHydrationWarning>
            {greeting}{name ? `, ${name}` : ''}!
          </p>
          <p className="topbar-sub">{subtitle}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
          background: 'rgba(212,96,26,0.1)', border: '1px solid rgba(212,96,26,0.2)',
          color: '#D4601A', letterSpacing: '0.04em',
        }}>
          Free Plan
        </div>
        <button className="topbar-bell" aria-label="Notifications">
          <Bell size={15} />
          <span className="topbar-bell-dot" />
        </button>
      </div>
    </div>
  )
}
