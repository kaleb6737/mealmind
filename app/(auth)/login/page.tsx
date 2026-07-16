'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, ChefHat, ArrowRight } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/use-supabase'

export default function LoginPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="auth-card">
      {/* Logo */}
      <Link href="/" className="auth-card-logo">
        <div className="logo-mark logo-mark-sm">
          <ChefHat size={15} color="white" strokeWidth={2.5} />
        </div>
        <span className="display text-lg tracking-widest" style={{ color: 'var(--accent)' }}>MEALMIND</span>
      </Link>

      {/* Heading */}
      <div className="auth-card-heading">
        <h1 className="display auth-card-title">WELCOME<br /><span style={{ color: 'var(--accent)' }}>BACK.</span></h1>
        <p className="auth-card-sub">Sign in to your meal prep companion</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label className="auth-label">Email</label>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" autoComplete="email"
            className="auth-input"
          />
        </div>

        <div className="auth-field">
          <label className="auth-label">Password</label>
          <div className="auth-input-wrap">
            <input
              type={showPw ? 'text' : 'password'} required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="current-password"
              className="auth-input pr-11"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="auth-eye" aria-label="Toggle password">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="auth-error" role="alert">{error}</p>
        )}

        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="auth-switch">
        No account?{' '}
        <Link href="/signup" className="auth-switch-link">Create one free</Link>
      </p>
    </div>
  )
}
