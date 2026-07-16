'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  LayoutDashboard, Package, ChefHat, Flame, DollarSign,
  ShoppingCart, MessageSquare, Sun, Moon, LogOut, Brain, ChevronLeft,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/pantry',    icon: Package,         label: 'Pantry'    },
  { href: '/recipes',   icon: ChefHat,         label: 'Recipes'   },
  { href: '/calories',  icon: Flame,           label: 'Calories'  },
  { href: '/spending',  icon: DollarSign,      label: 'Spending'  },
  { href: '/shopping',  icon: ShoppingCart,    label: 'Shopping'  },
  { href: '/chat',      icon: MessageSquare,   label: 'AI Chat'   },
]

export function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const { theme, setTheme } = useTheme()
  const supabase  = useSupabase()
  const [mounted, setMounted]   = useState(false)
  const [name, setName]         = useState('User')
  const [initials, setInitials] = useState('U')

  // Sliding spring indicator
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [ind, setInd] = useState<{ y: number; h: number; show: boolean }>({ y: 0, h: 0, show: false })
  const activeIndex = NAV.findIndex(
    n => pathname === n.href || pathname.startsWith(n.href + '/'),
  )

  useLayoutEffect(() => {
    const el = itemRefs.current[activeIndex]
    if (el) setInd({ y: el.offsetTop, h: el.offsetHeight, show: true })
    else setInd(s => ({ ...s, show: false }))
  }, [activeIndex, pathname])

  // Collapsible rail (persisted)
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    setCollapsed(localStorage.getItem('sidebar-collapsed') === '1')
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle('sidebar-collapsed', collapsed)
    localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      const raw   = user?.user_metadata?.full_name ?? user?.email ?? 'User'
      const first = raw.split(/[\s@]/)[0]
      setName(first)
      setInitials(raw.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase())
    })
  }, [supabase])

  async function handleLogout() {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
   <>
    <button
      className="sidebar-toggle"
      onClick={() => setCollapsed(c => !c)}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <ChevronLeft size={15} strokeWidth={2.5} />
    </button>
    <aside className="sidebar">

      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div className="logo-mark" style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0 }}>
          <Brain size={14} color="white" strokeWidth={2.5} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span className="display" style={{ fontSize: 15, letterSpacing: '0.12em', color: '#D4601A' }}>
            MEALMIND
          </span>
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>
            AI MEAL PREP
          </span>
        </div>
      </div>

      {/* ── Nav ── */}
      <span className="sidebar-section-label">NAVIGATE</span>
      <nav className="sidebar-nav">
        <span
          className="nav-indicator"
          style={{
            height: ind.h,
            transform: `translateY(${ind.y}px)`,
            opacity: ind.show ? 1 : 0,
          }}
          aria-hidden
        />
        {NAV.map(({ href, icon: Icon, label }, i) => {
          const active = i === activeIndex
          return (
            <Link
              key={href}
              href={href}
              ref={el => { itemRefs.current[i] = el }}
              className={`nav-item${active ? ' active' : ''}`}
              data-label={label}
            >
              <span className="nav-chip">
                <Icon size={16} strokeWidth={active ? 2.3 : 1.8} />
              </span>
              <span className="nav-label">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── User profile — pinned bottom ── */}
      <div className="sidebar-profile">
        <div className="sidebar-user-avatar" suppressHydrationWarning>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="sidebar-user-name" suppressHydrationWarning>{name}</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>Free plan</p>
        </div>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="sidebar-icon-btn"
            suppressHydrationWarning
            aria-label="Toggle theme"
          >
            {mounted
              ? theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />
              : <Sun size={14} />}
          </button>
          <button
            onClick={handleLogout}
            className="sidebar-icon-btn sidebar-icon-btn-danger"
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

    </aside>
   </>
  )
}
