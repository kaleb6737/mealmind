'use client'
import { useEffect, useState } from 'react'

export function CalorieRing({ value, goal = 2000 }: { value: number; goal?: number }) {
  const r = 54
  const c = 2 * Math.PI * r
  const pct = Math.min(value / goal, 1)
  const [off, setOff] = useState(c)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setOff(c * (1 - pct)); return }
    const t = setTimeout(() => setOff(c * (1 - pct)), 140)
    return () => clearTimeout(t)
  }, [c, pct])

  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width={140} height={140}>
        <circle cx={70} cy={70} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={12} fill="none" />
        <circle
          cx={70} cy={70} r={r} stroke="url(#ringGrad)" strokeWidth={12} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)',
            filter: 'drop-shadow(0 0 6px rgba(212,96,26,0.55))',
          }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D4601A" />
            <stop offset="100%" stopColor="#F0853D" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="display" style={{ fontSize: 32, lineHeight: 1, color: '#fff' }}>
          {Math.round(pct * 100)}%
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 3, letterSpacing: '0.05em' }}>
          OF GOAL
        </span>
      </div>
    </div>
  )
}
