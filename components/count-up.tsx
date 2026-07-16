'use client'
import { useEffect, useRef, useState } from 'react'

export function CountUp({
  value,
  prefix = '',
  duration = 1200,
}: {
  value: number
  prefix?: string
  duration?: number
}) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setN(value); return }
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setN(value)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return (
    <span ref={ref} suppressHydrationWarning>
      {prefix}{Math.round(n).toLocaleString()}
    </span>
  )
}
