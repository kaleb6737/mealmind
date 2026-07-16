import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TopBar } from '@/components/top-bar'
import { SetupRequired } from '@/components/setup-required'
import { Tilt } from '@/components/tilt'
import { CountUp } from '@/components/count-up'
import { CalorieRing } from '@/components/calorie-ring'
import { WeeklyChart } from '@/components/weekly-chart'
import { MacrosCard } from '@/components/macros-card'
import {
  Package, ChefHat, Flame, DollarSign, ShoppingCart,
  MessageSquare, ArrowRight, Sparkles,
} from 'lucide-react'

const FEATURE_CARDS = [
  {
    href: '/recipes', label: 'AI RECIPES',
    desc: 'Generate personalized meals from your pantry ingredients — instantly, intelligently.',
    icon: ChefHat,
    gradient: 'linear-gradient(135deg, #1E0D04 0%, #2D1508 50%, #1A1206 100%)',
    border: 'rgba(212,96,26,0.3)',
    accent: '#D4601A',
    glow: 'rgba(212,96,26,0.22)',
    badge: 'GROQ AI',
    shimmer: '#D4601A',
  },
  {
    href: '/calories', label: 'CALORIES',
    desc: 'Track macros, log every meal, and hit your daily nutrition targets with precision.',
    icon: Flame,
    gradient: 'linear-gradient(135deg, #1A0606 0%, #260B0B 50%, #181010 100%)',
    border: 'rgba(232,64,64,0.25)',
    accent: '#E84040',
    glow: 'rgba(232,64,64,0.18)',
    badge: 'DAILY',
    shimmer: '#E84040',
  },
  {
    href: '/spending', label: 'SPENDING',
    desc: 'Compare groceries vs eating out and surface monthly insights at a glance.',
    icon: DollarSign,
    gradient: 'linear-gradient(135deg, #05150A 0%, #0A1E10 50%, #081510 100%)',
    border: 'rgba(61,186,90,0.25)',
    accent: '#3DBA5A',
    glow: 'rgba(61,186,90,0.18)',
    badge: 'BUDGET',
    shimmer: '#3DBA5A',
  },
]

const QUICK = [
  { href: '/pantry',   icon: Package,       label: 'Pantry',   sub: 'Manage ingredients',   color: '#8B5CF6' },
  { href: '/shopping', icon: ShoppingCart,  label: 'Shopping', sub: 'Your grocery list',    color: '#4DA3E8' },
  { href: '/chat',     icon: MessageSquare, label: 'AI Chat',  sub: 'Ask anything about food', color: '#E8A830' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  if (!supabase) return <SetupRequired />

  const { data: { user } } = await supabase.auth.getUser()
  const [pantryRes, todayLogsRes, spendingRes, shoppingRes] = await Promise.all([
    supabase.from('pantry_items').select('id', { count: 'exact', head: true }),
    supabase.from('calorie_logs').select('calories').gte('logged_at', new Date().toISOString().split('T')[0]),
    supabase.from('spending_logs').select('amount').gte('date', new Date().toISOString().slice(0, 7) + '-01'),
    supabase.from('shopping_items').select('id', { count: 'exact', head: true }).eq('checked', false),
  ])

  const pantryCount   = pantryRes.count   ?? 0
  const todayCalories = todayLogsRes.data?.reduce((s, r) => s + r.calories, 0) ?? 0
  const monthSpending = spendingRes.data?.reduce((s, r) => s + r.amount, 0)   ?? 0
  const shoppingCount = shoppingRes.count ?? 0

  // Last 7 days of calories, bucketed by day (for the trend chart)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 6)
  const { data: weekLogs } = await supabase
    .from('calorie_logs')
    .select('calories, logged_at')
    .gte('logged_at', weekStart.toISOString().split('T')[0])
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().split('T')[0]
    const calories = (weekLogs ?? [])
      .filter(l => String(l.logged_at).startsWith(key))
      .reduce((s, l) => s + (l.calories ?? 0), 0)
    return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), calories }
  })
  const raw  = user?.user_metadata?.full_name ?? user?.email ?? 'User'
  const name = raw.split(/[\s@]/)[0]

  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const dateStr   = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase()

  const STATS = [
    { label: 'PANTRY ITEMS',   num: pantryCount,              prefix: '',  unit: 'ingredients', icon: Package,      color: '#8B5CF6', glow: 'rgba(139,92,246,0.15)' },
    { label: 'CALORIES TODAY', num: todayCalories,            prefix: '',  unit: 'kcal logged', icon: Flame,        color: '#E84040', glow: 'rgba(232,64,64,0.15)'  },
    { label: 'MONTH SPEND',    num: Math.round(monthSpending), prefix: '$', unit: 'this month',  icon: DollarSign,   color: '#3DBA5A', glow: 'rgba(61,186,90,0.15)'  },
    { label: 'TO BUY',         num: shoppingCount,            prefix: '',  unit: 'items left',  icon: ShoppingCart, color: '#4DA3E8', glow: 'rgba(77,163,232,0.15)' },
  ]

  return (
    <div className="app-page">
      <TopBar subtitle="Your AI meal prep hub" />
      <div className="app-content app-content-wide">

        {/* ── Hero row (bento: greeting + calorie ring) ───────────────────────── */}
        <div className="bento" style={{ marginBottom: 14 }}>
        <div className="col-8" style={{
          borderRadius: 28, padding: '36px 40px',
          background: 'linear-gradient(140deg, #1C0F05 0%, #2A1508 55%, #161208 100%)',
          border: '1px solid rgba(212,96,26,0.22)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div className="hero-shine" aria-hidden />
          {/* Dot-grid pattern overlay */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 28, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, rgba(212,96,26,0.12) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(ellipse 80% 80% at 100% 0%, black 0%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 100% 0%, black 0%, transparent 70%)',
          }} />
          {/* Ambient glow */}
          <div style={{
            position: 'absolute', top: -80, right: -80,
            width: 320, height: 320, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,96,26,0.28) 0%, transparent 65%)',
            filter: 'blur(50px)', pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Day badge + date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 99,
                background: 'rgba(212,96,26,0.14)', border: '1px solid rgba(212,96,26,0.3)',
              }}>
                <div className="day-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4601A' }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: '#D4601A' }}>
                  {dayOfWeek}
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>
                {dateStr}
              </span>
            </div>
            {/* Big headline */}
            <h1 className="display" style={{
              fontSize: 'clamp(40px, 5.5vw, 62px)', lineHeight: 0.95,
              background: 'linear-gradient(135deg, #FFFFFF 40%, rgba(255,255,255,0.55) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 0,
            }}>
              READY TO PREP,
            </h1>
            <h1 className="display grad-text" style={{
              fontSize: 'clamp(40px, 5.5vw, 62px)', lineHeight: 0.95,
              marginBottom: 28,
            }}>
              {name.toUpperCase()}?
            </h1>
            <Link href="/recipes" className="app-btn" style={{ fontSize: 13, padding: '10px 20px' }}>
              <Sparkles size={14} />
              Generate AI Recipes
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Calorie ring card (3D tilt) */}
        <Tilt className="col-4" max={7}>
        <div className="bento-cell" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 16, textAlign: 'center',
        }}>
          <span className="tilt-spot" />
          <p className="bento-eyebrow" style={{ alignSelf: 'flex-start' }}>TODAY&apos;S INTAKE</p>
          <CalorieRing value={todayCalories} goal={2000} />
          <div>
            <p className="display" style={{ fontSize: 22, color: 'var(--text-primary)', lineHeight: 1 }}>
              <CountUp value={todayCalories} /> <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>kcal</span>
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>of 2,000 daily target</p>
          </div>
        </div>
        </Tilt>
        </div>

        {/* ── Stats strip ───────────────────────────────────────────────────── */}
        <div className="fade-up delay-1 grid-stats" style={{ marginBottom: 28 }}>
          {STATS.map(s => (
            <Tilt key={s.label} max={6} style={{ borderRadius: 18 }}>
            <div className="stat-tile" style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
              <span className="tilt-spot" />
              {/* Glow blob */}
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 90, height: 90, borderRadius: '50%',
                background: `radial-gradient(circle, ${s.glow.replace('0.15', '0.35')} 0%, transparent 70%)`,
                filter: 'blur(18px)', pointerEvents: 'none',
              }} />
              <div className="stat-tile-accent" style={{ background: s.glow }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: s.glow, border: `1px solid ${s.color}30`,
                  }}>
                    <s.icon size={16} color={s.color} strokeWidth={2.2} />
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
                    color: 'var(--text-tertiary)', lineHeight: 1.3,
                  }}>
                    {s.label}
                  </span>
                </div>
                <p className="display" style={{
                  fontSize: 36, lineHeight: 1, color: 'var(--text-primary)',
                  background: `linear-gradient(135deg, #FFFFFF 0%, ${s.color} 120%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}><CountUp value={s.num} prefix={s.prefix} /></p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{s.unit}</p>
              </div>
            </div>
            </Tilt>
          ))}
        </div>

        {/* ── Trend chart + AI promo (bento) ───────────────────────────────────── */}
        <div className="bento" style={{ marginBottom: 28 }}>
          <div className="col-8 bento-cell">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <p className="bento-eyebrow">THIS WEEK</p>
                <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Calorie Trend</p>
              </div>
              <div style={{
                width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: 'rgba(232,114,43,0.12)', border: '1px solid rgba(232,114,43,0.25)',
              }}>
                <Flame size={18} color="#E8722B" />
              </div>
            </div>
            <WeeklyChart data={chartData} />
          </div>
          <Tilt className="col-4" max={7}>
          <div className="bento-cell" style={{ height: '100%' }}>
            <span className="tilt-spot" />
            <MacrosCard calories={todayCalories} />
          </div>
          </Tilt>
        </div>

        {/* ── Feature cards ─────────────────────────────────────────────────── */}
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: 'var(--text-tertiary)', marginBottom: 12 }}>
          FEATURES
        </p>
        <div className="fade-up delay-2 grid-3" style={{ marginBottom: 28 }}>
          {FEATURE_CARDS.map(({ href, label, desc, icon: Icon, gradient, border, accent, glow, badge, shimmer }) => (
            <Tilt key={href} style={{ borderRadius: 24 }}>
            <Link href={href} style={{
              background: gradient,
              border: `1px solid ${border}`,
              borderRadius: 24, padding: '26px 24px', height: '100%',
              display: 'flex', flexDirection: 'column', gap: 18,
              textDecoration: 'none', position: 'relative', overflow: 'hidden',
            }}>
              <span className="tilt-spot" />
              {/* Shimmer line at top */}
              <div style={{
                position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
                background: `linear-gradient(90deg, transparent 0%, ${shimmer}80 50%, transparent 100%)`,
                borderRadius: 1,
              }} />
              {/* Ambient glow blob */}
              <div style={{
                position: 'absolute', top: -40, right: -40, width: 140, height: 140,
                borderRadius: '50%', background: glow, filter: 'blur(35px)', pointerEvents: 'none',
              }} />
              {/* Icon + badge row */}
              <div style={{
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', position: 'relative',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${accent}1A`, border: `1px solid ${accent}45`,
                }}>
                  <Icon size={24} color={accent} strokeWidth={1.8} />
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
                  padding: '5px 10px', borderRadius: 99,
                  background: `${accent}1A`, color: accent,
                  border: `1px solid ${accent}35`,
                }}>{badge}</span>
              </div>
              {/* Text block */}
              <div style={{ position: 'relative', flex: 1 }}>
                <p className="display" style={{
                  fontSize: 23, lineHeight: 1.05, color: '#FFFFFF', marginBottom: 8,
                  letterSpacing: '0.02em',
                }}>{label}</p>
                <p style={{
                  fontSize: 12, lineHeight: 1.65,
                  color: 'rgba(255,255,255,0.52)',
                }}>{desc}</p>
              </div>
              {/* CTA row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto',
                borderTop: `1px solid ${accent}20`, paddingTop: 14,
              }}>
                <ArrowRight size={12} color={accent} />
                <span style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: '0.04em' }}>
                  Open
                </span>
              </div>
            </Link>
            </Tilt>
          ))}
        </div>

        {/* ── Quick access ──────────────────────────────────────────────────── */}
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: 'var(--text-tertiary)', marginBottom: 12 }}>
          QUICK ACCESS
        </p>
        <div className="fade-up delay-3 grid-3" style={{ gap: 10, marginBottom: 24 }}>
          {QUICK.map(({ href, icon: Icon, label, sub, color }) => (
            <Link key={href} href={href} className="app-card app-card-hover" style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '18px 20px', textDecoration: 'none',
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${color}16`, border: `1px solid ${color}28`,
              }}>
                <Icon size={20} color={color} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.2 }}>{label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3, lineHeight: 1.3 }}>{sub}</p>
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-subtle)',
              }}>
                <ArrowRight size={13} color="var(--text-tertiary)" />
              </div>
            </Link>
          ))}
        </div>


      </div>
    </div>
  )
}
