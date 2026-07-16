'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ChefHat, Brain, ShoppingCart, MessageSquare, Flame,
  ArrowRight, Check, Sparkles, UtensilsCrossed, BarChart3,
} from 'lucide-react'

const features = [
  { icon: Brain,           title: 'AI Recipe Generator',  desc: 'Groq-powered AI scans your pantry and builds recipes around what you already have. Zero waste, maximum flavor.' },
  { icon: Flame,           title: 'Calorie Tracker',       desc: 'Log meals in seconds. Track macros, monitor eating-out habits, and stay on top of your daily goals.' },
  { icon: BarChart3,       title: 'Spending Insights',     desc: 'See exactly how much you spend on groceries vs eating out. Monthly breakdowns that actually change behavior.' },
  { icon: ShoppingCart,    title: 'Smart Shopping List',   desc: 'Auto-generate shopping lists from saved recipes. Add manually or let AI fill every gap.' },
  { icon: UtensilsCrossed, title: 'Pantry Manager',        desc: 'Track every ingredient with categories and expiry awareness. Never overbuy or run out again.' },
  { icon: MessageSquare,   title: 'AI Chat Assistant',     desc: '"What can I cook tonight?" Your personal nutrition brain — context-aware and always on.' },
]

const steps = [
  { n: '01', title: 'Add your pantry',  desc: 'Tell MealMind what ingredients you have at home in seconds.' },
  { n: '02', title: 'Get AI recipes',   desc: 'Groq AI analyzes your pantry and builds personalized meal plans instantly.' },
  { n: '03', title: 'Track & save',     desc: 'Log meals, monitor spending, and finally break the eating-out cycle.' },
]

export default function LandingPage() {
  const previewRef = useRef<HTMLDivElement>(null)

  // Cursor-tracking glow via CSS custom properties
  useEffect(() => {
    const move = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--cx', `${e.clientX}px`)
      document.documentElement.style.setProperty('--cy', `${e.clientY}px`)
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, [])

  // 3-D tilt on the hero preview card (RAF-throttled)
  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    let raf = 0
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r  = el.getBoundingClientRect()
        const dx = ((e.clientX - r.left)  / r.width  - 0.5) * 2
        const dy = ((e.clientY - r.top)   / r.height - 0.5) * 2
        el.style.setProperty('--rx', `${Math.max(-12, Math.min(12, -dy * 10))}deg`)
        el.style.setProperty('--ry', `${Math.max(-12, Math.min(12,  dx * 10))}deg`)
        el.style.setProperty('--mx', `${((dx + 1) / 2 * 100).toFixed(1)}%`)
        el.style.setProperty('--my', `${((dy + 1) / 2 * 100).toFixed(1)}%`)
      })
    }
    const onLeave = () => {
      cancelAnimationFrame(raf)
      el.style.setProperty('--rx', '2deg')
      el.style.setProperty('--ry', '-4deg')
    }
    el.addEventListener('mousemove', onMove, { passive: true })
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Scroll-reveal via IntersectionObserver (no layout thrashing)
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target) }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    )
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div className="landing-root">
      <div className="cursor-glow" aria-hidden />
      <div className="landing-grid" aria-hidden />
      <div className="hero-blob hero-blob-1" aria-hidden />
      <div className="hero-blob hero-blob-2" aria-hidden />

      {/* ── NAV ── */}
      <nav className="landing-nav">
        <div className="landing-container nav-inner">
          <Link href="/" className="nav-brand">
            <div className="logo-mark"><ChefHat size={18} color="white" strokeWidth={2.5} /></div>
            <span className="display text-xl tracking-widest" style={{ color: '#D4601A' }}>MEALMIND</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="nav-link">Sign In</Link>
            <Link href="/signup" className="btn-cta btn-cta-sm">Get Started <ArrowRight size={12} /></Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section">
        <div className="landing-container hero-inner">
          <div className="hero-badge reveal">
            <Sparkles size={12} />
            <span>Powered by Groq — world&apos;s fastest AI inference</span>
          </div>

          <h1 className="hero-hl display reveal">
            STOP EATING OUT.<br />
            <span className="hero-hl-grad">START EATING SMART.</span>
          </h1>

          <p className="hero-sub reveal">
            MealMind turns your pantry into personalized AI recipes, tracks every calorie,
            and shows you exactly how much you&apos;re wasting on takeout.
          </p>

          <div className="hero-actions reveal">
            <Link href="/signup" className="btn-cta btn-cta-lg">Start for Free <ArrowRight size={16} /></Link>
            <Link href="/login" className="btn-ghost">Already have an account →</Link>
          </div>

          <div className="hero-trust reveal">
            {['No credit card', 'Free plan forever', 'AI recipes in 30 seconds'].map(t => (
              <span key={t} className="trust-chip"><Check size={10} strokeWidth={3} />{t}</span>
            ))}
          </div>

          {/* ── 3-D PREVIEW CARD ── */}
          <div ref={previewRef} className="preview-3d reveal">
            <div className="preview-shine" aria-hidden />
            <div className="preview-topbar">
              <div className="preview-dots" aria-hidden><span /><span /><span /></div>
              <span className="preview-url">mealmind.app / dashboard</span>
            </div>
            <div className="preview-body">
              <div className="preview-stats">
                {[
                  { label: 'Calories Today',  val: '1,840', sub: '/ 2,200 goal',      c: '#D4601A' },
                  { label: 'Groceries (Jun)', val: '$124',  sub: 'vs $280 eating out', c: '#3DBA5A' },
                  { label: 'Pantry Items',    val: '34',    sub: 'ingredients ready',  c: '#4DA3E8' },
                ].map(s => (
                  <div key={s.label} className="pstat">
                    <div className="pstat-val" style={{ color: s.c }}>{s.val}</div>
                    <div className="pstat-label">{s.label}</div>
                    <div className="pstat-sub">{s.sub}</div>
                  </div>
                ))}
              </div>
              <div className="preview-ai-chip">
                <Brain size={13} style={{ color: '#D4601A' }} />
                <span>AI suggests: <strong>Chicken Stir-Fry</strong> — uses 8 pantry items</span>
                <span className="preview-pill">View</span>
              </div>
              <div className="preview-bars" aria-hidden>
                {[60, 85, 45, 90, 70, 95, 55, 78, 65, 88, 50, 82].map((h, i) => (
                  <div key={i} className="pbar-wrap">
                    <div className="pbar-fill" style={{ height: `${h}%`, animationDelay: `${i * 0.06}s` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div className="stats-strip">
        <div className="landing-container stats-inner">
          {[
            { val: '3×',    label: 'More home-cooked meals' },
            { val: '40%',   label: 'Average grocery savings' },
            { val: '< 30s', label: 'Recipe generation time'  },
          ].map(s => (
            <div key={s.label} className="stat-block reveal">
              <div className="stat-big display">{s.val}</div>
              <div className="stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="l-section">
        <div className="landing-container">
          <div className="l-header">
            <p className="l-eyebrow reveal">Everything you need</p>
            <h2 className="display l-title reveal">YOUR MEAL PREP<br /><span style={{ color: '#D4601A' }}>COMMAND CENTER</span></h2>
            <p className="l-sub reveal">Six tools in one app — from AI recipes to budget tracking.</p>
          </div>
          <div className="feat-grid">
            {features.map((f, i) => (
              <div key={f.title} className="feat-card reveal" style={{ transitionDelay: `${(i % 3) * 0.07}s` }}>
                <div className="feat-icon"><f.icon size={20} strokeWidth={1.75} /></div>
                <h3 className="feat-title">{f.title}</h3>
                <p className="feat-desc">{f.desc}</p>
                <div className="feat-glow" aria-hidden />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="l-section l-section-alt">
        <div className="landing-container">
          <div className="l-header">
            <p className="l-eyebrow reveal">Simple process</p>
            <h2 className="display l-title reveal">THREE STEPS TO<br /><span style={{ color: '#D4601A' }}>MEAL FREEDOM</span></h2>
          </div>
          <div className="steps-row">
            {steps.map((s, i) => (
              <div key={s.n} className="step-card reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="step-num display">{s.n}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="cta-section">
        <div className="cta-blob" aria-hidden />
        <div className="landing-container cta-inner">
          <p className="l-eyebrow reveal">Ready to start?</p>
          <h2 className="display cta-hl reveal">COOK MORE.<br />SPEND LESS.<br /><span style={{ color: '#D4601A' }}>EAT BETTER.</span></h2>
          <p className="cta-sub reveal">Join MealMind and take control of what you eat and what you spend.</p>
          <Link href="/signup" className="btn-cta btn-cta-lg reveal">Create Your Free Account <ArrowRight size={16} /></Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="l-footer">
        <div className="landing-container l-footer-inner">
          <div className="flex items-center gap-2">
            <ChefHat size={14} style={{ color: 'rgba(255,255,255,0.18)' }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.18)' }}>© 2026 MealMind</span>
          </div>
          <div className="flex gap-6">
            <Link href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.18)' }}>Sign In</Link>
            <Link href="/signup" style={{ fontSize: 13, color: 'rgba(255,255,255,0.18)' }}>Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
