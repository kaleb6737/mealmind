'use client'
import { useRef, type ReactNode, type CSSProperties } from 'react'

export function Tilt({
  children,
  className = '',
  style,
  max = 9,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const raf = useRef<number | null>(null)

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`)
      el.style.setProperty('--mx', `${((px + 0.5) * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${((py + 0.5) * 100).toFixed(1)}%`)
    })
  }

  function onLeave() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-card ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}
