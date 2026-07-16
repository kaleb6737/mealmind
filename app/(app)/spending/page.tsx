'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { Plus, Trash2, Loader2, ShoppingCart, UtensilsCrossed, Wallet } from 'lucide-react'
import { TopBar } from '@/components/top-bar'
import { SetupRequired } from '@/components/setup-required'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency, getMonthName } from '@/lib/utils'

type Log = { id: string; description: string; amount: number; type: 'grocery' | 'eating_out'; date: string }

const MONTHS = 6

function getMonthRange() {
  const months = []
  for (let i = MONTHS - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push({ key: d.toISOString().slice(0, 7), label: getMonthName(d) })
  }
  return months
}

export default function SpendingPage() {
  const supabase = useSupabase()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    description: '', amount: '',
    type: 'grocery' as 'grocery' | 'eating_out',
    date: new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)

  const fetchLogs = useCallback(async () => {
    if (!supabase) return
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - MONTHS)
    const { data } = await supabase.from('spending_logs').select('*')
      .gte('date', sixMonthsAgo.toISOString().split('T')[0]).order('date', { ascending: false })
    setLogs(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  async function addLog(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('spending_logs').insert({ ...form, amount: +form.amount, user_id: user!.id })
    setForm({ description: '', amount: '', type: 'grocery', date: new Date().toISOString().split('T')[0] })
    setShowAdd(false)
    setSaving(false)
    fetchLogs()
  }

  async function deleteLog(id: string) {
    if (!supabase) return
    await supabase.from('spending_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const months = getMonthRange()
  const chartData = months.map(({ key, label }) => {
    const ml = logs.filter(l => l.date.startsWith(key))
    return {
      month: label,
      Grocery: ml.filter(l => l.type === 'grocery').reduce((s, l) => s + l.amount, 0),
      'Eating Out': ml.filter(l => l.type === 'eating_out').reduce((s, l) => s + l.amount, 0),
    }
  })

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentLogs = logs.filter(l => l.date.startsWith(currentMonth))
  const groceryTotal = currentLogs.filter(l => l.type === 'grocery').reduce((s, l) => s + l.amount, 0)
  const eatingOutTotal = currentLogs.filter(l => l.type === 'eating_out').reduce((s, l) => s + l.amount, 0)

  if (mounted && !supabase) return <SetupRequired />

  return (
    <div className="app-page">
      <TopBar subtitle="Track your food budget" />
      <div className="app-content app-content-wide">

        {/* Header */}
        <div className="page-hd fade-up">
          <div>
            <p className="page-eyebrow">BUDGET TRACKER</p>
            <h1 className="display page-title">SPENDING</h1>
            <p className="page-sub">Track groceries vs eating out</p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="app-btn"
            style={{ gap: 8 }}
          >
            <Plus size={15} />
            {showAdd ? 'Cancel' : 'Add Entry'}
          </button>
        </div>

        {/* Stat tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            {
              label: 'GROCERIES', value: groceryTotal,
              color: 'var(--green)', bg: 'var(--green-subtle)',
              Icon: ShoppingCart, delay: 'delay-1',
            },
            {
              label: 'EATING OUT', value: eatingOutTotal,
              color: 'var(--accent)', bg: 'var(--accent-subtle)',
              Icon: UtensilsCrossed, delay: 'delay-2',
            },
            {
              label: 'TOTAL', value: groceryTotal + eatingOutTotal,
              color: 'var(--blue)', bg: 'var(--blue-subtle)',
              Icon: Wallet, delay: 'delay-3',
            },
          ].map(({ label, value, color, bg, Icon, delay }) => (
            <div key={label} className={`stat-tile fade-up ${delay}`}>
              {/* Ambient glow blob */}
              <div
                className="stat-tile-accent"
                style={{ background: color, opacity: 0.7 }}
              />
              {/* Icon circle */}
              <div style={{
                width: 38, height: 38, borderRadius: 12, marginBottom: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: bg,
              }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                color: 'var(--text-tertiary)', marginBottom: 5,
              }}>
                {label}
              </p>
              <p
                className="display"
                style={{ fontSize: 32, lineHeight: 1, color, marginBottom: 5 }}
              >
                {formatCurrency(value)}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>this month</p>
            </div>
          ))}
        </div>

        {/* Chart card */}
        <div className="app-card fade-up delay-4" style={{ padding: '22px 24px', marginBottom: 20 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
            color: 'var(--text-tertiary)', marginBottom: 18,
          }}>
            6-MONTH COMPARISON
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4} barCategoryGap="28%">
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
                formatter={(v) => [formatCurrency(Number(v))]}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              <Bar dataKey="Grocery" fill="#3DBA5A" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Eating Out" fill="#D4601A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Add form */}
        {showAdd && (
          <form
            onSubmit={addLog}
            className="app-card fade-up"
            style={{
              padding: '18px 20px', marginBottom: 20,
              display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
              borderColor: 'rgba(212,96,26,0.3)',
              background: 'linear-gradient(135deg, var(--bg-card), var(--accent-subtle))',
            }}
          >
            <input
              required
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Description"
              className="app-input"
              style={{ flex: '1 1 160px', minWidth: 0 }}
            />
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="Amount $"
              className="app-input"
              style={{ width: 112, flexShrink: 0 }}
            />
            <select
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value as 'grocery' | 'eating_out' }))}
              className="app-select"
              style={{ flexShrink: 0 }}
            >
              <option value="grocery">Grocery</option>
              <option value="eating_out">Eating Out</option>
            </select>
            <input
              type="date"
              required
              value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              className="app-select"
              style={{ flexShrink: 0 }}
            />
            <button type="submit" disabled={saving} className="app-btn" style={{ flexShrink: 0 }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Save
            </button>
          </form>
        )}

        {/* Transaction list */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 80 }}>
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state fade-up">
            <div className="empty-icon" style={{ background: 'var(--blue-subtle)', color: 'var(--blue)' }}>
              <Wallet size={28} />
            </div>
            <p className="display" style={{ fontSize: 30, color: 'var(--text-tertiary)', marginBottom: 8 }}>
              NO ENTRIES YET
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              Add your first spending entry above
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Section label */}
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
              color: 'var(--text-tertiary)', marginBottom: 4, paddingLeft: 2,
            }}>
              RECENT TRANSACTIONS
            </p>

            {logs.slice(0, 30).map((log, i) => (
              <div
                key={log.id}
                className={`app-card app-card-hover fade-up delay-${Math.min(i + 1, 6) as 1 | 2 | 3 | 4 | 5 | 6}`}
                style={{
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}
              >
                {/* Left */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <span
                    className="app-badge"
                    style={log.type === 'grocery'
                      ? { background: 'var(--green-subtle)', color: 'var(--green)', flexShrink: 0 }
                      : { background: 'var(--accent-subtle)', color: 'var(--accent)', flexShrink: 0 }}
                  >
                    {log.type === 'grocery' ? 'GROCERY' : 'EATING OUT'}
                  </span>
                  <span
                    style={{
                      fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {log.description}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    {log.date}
                  </span>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <span className="display" style={{ fontSize: 18, color: 'var(--text-primary)' }}>
                    {formatCurrency(log.amount)}
                  </span>
                  <button
                    onClick={() => deleteLog(log.id)}
                    style={{
                      width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'transparent', color: 'var(--text-tertiary)',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => {
                      const t = e.currentTarget
                      t.style.background = 'var(--red-subtle)'
                      t.style.color = 'var(--red)'
                    }}
                    onMouseLeave={e => {
                      const t = e.currentTarget
                      t.style.background = 'transparent'
                      t.style.color = 'var(--text-tertiary)'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
