'use client'
import { useEffect } from 'react'

export function Spotlight() {
  useEffect(() => {
    let raf = 0
    const onMove = (e: PointerEvent) => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const root = document.documentElement
        root.style.setProperty('--spot-x', `${e.clientX}px`)
        root.style.setProperty('--spot-y', `${e.clientY}px`)
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return <div className="app-spotlight" aria-hidden />
}
