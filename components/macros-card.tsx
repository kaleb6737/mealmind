'use client'
import { useEffect, useState } from 'react'
import { Beef, Wheat, Droplet } from 'lucide-react'

export function MacrosCard({ calories }: { calories: number }) {
  const macros = [
    { key: 'Protein', grams: Math.round((calories * 0.30) / 4), goal: 150, color: '#E8722B', icon: Beef },
    { key: 'Carbs',   grams: Math.round((calories * 0.45) / 4), goal: 225, color: '#4DA3E8', icon: Wheat },
    { key: 'Fats',    grams: Math.round((calories * 0.25) / 9), goal: 65,  color: '#3DBA5A', icon: Droplet },
  ]
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120)
    return () => clearTimeout(t)
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <p className="bento-eyebrow">TODAY</p>
          <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Macros</p>
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(212,96,26,0.12)', border: '1px solid rgba(212,96,26,0.25)',
        }}>
          <Beef size={18} color="#E8722B" />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {macros.map(({ key, grams, goal, color, icon: Icon }) => {
          const pct = Math.min(grams / goal, 1)
          return (
            <div key={key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${color}1F`, border: `1px solid ${color}40`,
                }}>
                  <Icon size={13} color={color} strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', flex: 1 }}>{key}</span>
                <span className="display" style={{ fontSize: 15, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {grams}<span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>g</span>
                </span>
              </div>
              <div style={{ height: 7, borderRadius: 99, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: mounted ? `${pct * 100}%` : '0%',
                  background: `linear-gradient(90deg, ${color}, ${color}AA)`,
                  boxShadow: `0 0 12px ${color}66`,
                  transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
