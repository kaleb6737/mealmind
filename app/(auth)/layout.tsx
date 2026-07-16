import Link from 'next/link'
import { ChefHat, Brain, Flame, BarChart3, ShoppingCart } from 'lucide-react'

const featurePills = [
  { icon: Brain, label: 'AI Recipes' },
  { icon: Flame, label: 'Calorie Tracking' },
  { icon: BarChart3, label: 'Spend Analysis' },
  { icon: ShoppingCart, label: 'Smart Lists' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-root">
      {/* ── Left: form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          {children}
        </div>
      </div>

      {/* ── Right: visual panel ── */}
      <div className="auth-visual-panel">
        {/* Background layers */}
        <div className="auth-grid-bg" />
        <div className="auth-glow-1" />
        <div className="auth-glow-2" />

        {/* Content */}
        <div className="auth-visual-content">
          {/* Logo */}
          <Link href="/" className="auth-visual-logo">
            <div className="logo-mark">
              <ChefHat size={16} color="white" strokeWidth={2.5} />
            </div>
            <span className="display text-lg tracking-widest" style={{ color: '#D4601A' }}>MEALMIND</span>
          </Link>

          {/* Big headline */}
          <h2 className="auth-visual-headline display">
            MEAL PREP<br />
            <span className="auth-headline-accent">SMARTER.</span>
          </h2>

          <p className="auth-visual-sub">
            AI recipes from your pantry, calorie tracking,
            and spending insights — all in one place.
          </p>

          {/* Feature pills */}
          <div className="auth-pills">
            {featurePills.map(f => (
              <span key={f.label} className="auth-pill">
                <f.icon size={12} strokeWidth={2} />
                {f.label}
              </span>
            ))}
          </div>

          {/* Decorative stat cards */}
          <div className="auth-stat-cards">
            <div className="auth-stat-card">
              <div className="auth-stat-val" style={{ color: '#D4601A' }}>3×</div>
              <div className="auth-stat-label">More home meals</div>
            </div>
            <div className="auth-stat-card">
              <div className="auth-stat-val" style={{ color: '#3DBA5A' }}>40%</div>
              <div className="auth-stat-label">Grocery savings</div>
            </div>
            <div className="auth-stat-card">
              <div className="auth-stat-val" style={{ color: '#4DA3E8' }}>30s</div>
              <div className="auth-stat-label">Recipe generation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
