'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { Plus, Trash2, Loader2, Flame, Sparkles, Brain, Check } from 'lucide-react'
import { TopBar } from '@/components/top-bar'
import { SetupRequired } from '@/components/setup-required'

type Log = {
  id: string; meal_name: string; calories: number
  protein: number; carbs: number; fat: number
  logged_at: string; type: string
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const GOAL = 2000

const MACRO_CONFIG = [
  { key: 'protein', label: 'PROTEIN', color: '#4DA3E8', goal: 150 },
  { key: 'carbs',   label: 'CARBS',   color: '#E8A830', goal: 250 },
  { key: 'fat',     label: 'FAT',     color: '#E84040', goal: 65  },
]

const TYPE_COLORS: Record<string, string> = {
  Breakfast: '#E8A830', Lunch: '#4DA3E8', Dinner: '#D4601A', Snack: '#3DBA5A',
}

function CalRing({ pct, total, goal }: { pct: number; total: number; goal: number }) {
  const r = 80
  const circ = 2 * Math.PI * r
  const dash = circ * Math.min(pct / 100, 1)
  const over = pct >= 100
  const color = over ? '#F05050' : '#D4601A'
  const trackColor = over ? 'rgba(240,80,80,0.1)' : 'rgba(212,96,26,0.1)'
  return (
    <div style={{ position: 'relative', width: 200, height: 200 }}>
      <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="100" cy="100" r={r} fill="none" stroke={trackColor} strokeWidth="14" />
        <circle
          cx="100" cy="100" r={r} fill="none" strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{
            stroke: color,
            filter: `drop-shadow(0 0 8px ${color}88)`,
            transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
        {over && (
          <circle cx="100" cy="100" r={r} fill="none" strokeWidth="14"
            strokeLinecap="round" stroke="rgba(240,80,80,0.35)"
            strokeDasharray={`${circ * ((pct - 100) / 100)} ${circ}`}
          />
        )}
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <p className="display" style={{ fontSize: 42, lineHeight: 1, color: over ? '#F05050' : 'var(--text-primary)' }}>
          {total}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>of {goal} kcal</p>
        <div style={{
          marginTop: 8, padding: '2px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
          background: over ? 'rgba(240,80,80,0.15)' : 'rgba(212,96,26,0.15)',
          color: over ? '#F05050' : '#D4601A',
        }}>
          {Math.round(pct)}%
        </div>
      </div>
    </div>
  )
}

export default function CaloriesPage() {
  const supabase = useSupabase()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [logs, setLogs]       = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState({ meal_name: '', calories: '', protein: '', carbs: '', fat: '', type: 'Breakfast' })
  const [saving, setSaving]   = useState(false)
  const [saveError, setSaveError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiEstimated, setAiEstimated] = useState(false)
  const mealInputRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]

  const fetchLogs = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('calorie_logs').select('*')
      .gte('logged_at', today).order('logged_at', { ascending: false })
    setLogs(data ?? [])
    setLoading(false)
  }, [supabase, today])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  async function analyzeWithAI() {
    if (!form.meal_name.trim() || analyzing) return
    setAnalyzing(true)
    setAiEstimated(false)
    try {
      const res = await fetch('/api/estimate-calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal: form.meal_name }),
      })
      if (!res.ok) throw new Error('AI request failed')
      const data = await res.json()
      setForm(p => ({
        ...p,
        calories: String(data.calories),
        protein:  String(data.protein),
        carbs:    String(data.carbs),
        fat:      String(data.fat),
      }))
      setAiEstimated(true)
    } catch {
      // leave form empty for manual entry
    } finally {
      setAnalyzing(false)
    }
  }

  async function addLog(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    setSaveError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('calorie_logs').insert({
      meal_name: form.meal_name,
      calories:  +form.calories,
      protein:   +form.protein,
      carbs:     +form.carbs,
      fat:       +form.fat,
      type:      form.type,
      user_id:   user!.id,
      logged_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    setForm({ meal_name: '', calories: '', protein: '', carbs: '', fat: '', type: 'Breakfast' })
    setShowAdd(false)
    setAiEstimated(false)
    fetchLogs()
  }

  async function deleteLog(id: string) {
    if (!supabase) return
    await supabase.from('calorie_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const totals = logs.reduce(
    (acc, l) => ({ calories: acc.calories + l.calories, protein: acc.protein + l.protein, carbs: acc.carbs + l.carbs, fat: acc.fat + l.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
  const calPct   = (totals.calories / GOAL) * 100
  const remaining = Math.max(GOAL - totals.calories, 0)

  if (mounted && !supabase) return <SetupRequired />

  return (
    <div className="app-page">
      <TopBar subtitle="Track your daily nutrition" />
      <div className="app-content" style={{ maxWidth: 860 }}>

        {/* Header */}
        <div className="page-hd fade-up">
          <div>
            <p className="page-eyebrow">NUTRITION</p>
            <h1 className="display page-title">CALORIES</h1>
            <p className="page-sub">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button className="app-btn" onClick={() => { setShowAdd(s => !s); setTimeout(() => mealInputRef.current?.focus(), 50) }}>
            <Plus size={15} /> Log Meal
          </button>
        </div>

        {/* ── AI Log Form ── */}
        {showAdd && (
          <form onSubmit={addLog} className="fade-up" style={{
            borderRadius: 20, marginBottom: 20, overflow: 'hidden',
            background: 'var(--bg-card)', border: '1px solid rgba(212,96,26,0.3)',
            boxShadow: '0 0 40px rgba(212,96,26,0.08)',
          }}>
            {/* AI Input Bar */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(212,96,26,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Brain size={14} color="#D4601A" />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#D4601A' }}>AI MEAL ANALYZER</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>· Powered by Groq</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={mealInputRef}
                  required
                  value={form.meal_name}
                  onChange={e => { setForm(p => ({ ...p, meal_name: e.target.value })); setAiEstimated(false) }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyzeWithAI() } }}
                  placeholder="Type a meal… e.g. 'grilled chicken breast with rice and broccoli'"
                  className="app-input"
                  style={{ flex: 1, fontSize: 15 }}
                />
                <button
                  type="button"
                  onClick={analyzeWithAI}
                  disabled={analyzing || !form.meal_name.trim()}
                  style={{
                    padding: '0 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 13, gap: 7, display: 'flex', alignItems: 'center',
                    background: analyzing ? 'var(--bg-subtle)' : 'linear-gradient(135deg,#D4601A,#E8722B)',
                    color: analyzing ? 'var(--text-tertiary)' : 'white',
                    transition: 'all 0.2s', flexShrink: 0,
                    boxShadow: analyzing ? 'none' : '0 0 20px rgba(212,96,26,0.35)',
                  }}
                >
                  {analyzing
                    ? <><Loader2 size={14} className="animate-spin" /> Analyzing…</>
                    : <><Sparkles size={14} /> Analyze</>}
                </button>
              </div>
              {aiEstimated && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#3DBA5A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={10} color="white" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 11, color: '#3DBA5A', fontWeight: 600 }}>Nutrition estimated by AI — review and edit below if needed</span>
                </div>
              )}
            </div>

            {/* Nutrition Fields */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
                {([
                  ['calories', 'Calories', 'kcal', '#D4601A'],
                  ['protein',  'Protein',  'g',    '#4DA3E8'],
                  ['carbs',    'Carbs',    'g',    '#E8A830'],
                  ['fat',      'Fat',      'g',    '#E84040'],
                ] as [string, string, string, string][]).map(([key, label, unit, color]) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color }}>{label.toUpperCase()}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number" min="0" required
                        value={form[key as keyof typeof form]}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                        placeholder="0"
                        className="app-input"
                        style={{
                          paddingRight: 28,
                          borderColor: aiEstimated && form[key as keyof typeof form] ? color + '60' : undefined,
                          background: aiEstimated && form[key as keyof typeof form] ? color + '0A' : undefined,
                        }}
                      />
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                        {unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {saveError && (
                <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10, padding: '8px 12px', borderRadius: 10, background: 'var(--red-subtle)' }}>
                  {saveError}
                </p>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="app-select" style={{ flex: 1 }}
                >
                  {MEAL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <button type="submit" disabled={saving} className="app-btn">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Save Meal
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── Progress Hero ── */}
        <div className="fade-up delay-1" style={{
          borderRadius: 24, padding: '28px 32px', marginBottom: 16,
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-subtle) 100%)',
          border: '1px solid var(--border)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,96,26,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', gap: 36, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>

            {/* Ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CalRing pct={calPct} total={totals.calories} goal={GOAL} />
            </div>

            {/* Stats + Macros */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                {[
                  { label: 'CONSUMED', val: totals.calories, unit: 'kcal', color: 'var(--text-primary)' },
                  { label: 'REMAINING', val: remaining, unit: 'kcal', color: calPct >= 100 ? 'var(--red)' : 'var(--accent)' },
                  { label: 'BURNED', val: 0, unit: 'est.', color: 'var(--green)' },
                ].map(s => (
                  <div key={s.label}>
                    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-tertiary)', marginBottom: 4 }}>{s.label}</p>
                    <p className="display" style={{ fontSize: 32, lineHeight: 1, color: s.color }}>{s.val}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.unit}</p>
                  </div>
                ))}
              </div>

              {/* Macro bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {MACRO_CONFIG.map(({ key, label, color, goal: macGoal }) => {
                  const val = totals[key as keyof typeof totals]
                  const pct = Math.min(Math.round((val / macGoal) * 100), 100)
                  return (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)' }}>{label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color }}>{val}g <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>/ {macGoal}g</span></span>
                      </div>
                      <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 99, width: `${pct}%`,
                          background: `linear-gradient(90deg, ${color}99, ${color})`,
                          boxShadow: `0 0 8px ${color}55`,
                          transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Meal Log ── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state fade-up delay-2">
            <div className="empty-icon" style={{ background: 'rgba(212,96,26,0.08)', border: '1px solid rgba(212,96,26,0.15)' }}>
              <Flame size={28} color="#D4601A" />
            </div>
            <p className="display" style={{ fontSize: 26, color: 'var(--text-tertiary)', marginBottom: 8 }}>NO MEALS YET</p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>Type any meal and let AI figure out the nutrition</p>
            <button className="app-btn" onClick={() => { setShowAdd(true); setTimeout(() => mealInputRef.current?.focus(), 50) }}>
              <Brain size={14} /> Log with AI
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
              TODAY&apos;S MEALS — {logs.length} logged
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {logs.map((log, i) => {
                const typeColor = TYPE_COLORS[log.type] ?? '#D4601A'
                return (
                  <div key={log.id} className={`app-card app-card-hover fade-up ${i < 6 ? `delay-${i + 1}` : ''}`}
                    style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: typeColor + '18' }}>
                          <Flame size={15} color={typeColor} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{log.meal_name}</p>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {[
                              { label: 'P', val: log.protein, color: '#4DA3E8' },
                              { label: 'C', val: log.carbs,   color: '#E8A830' },
                              { label: 'F', val: log.fat,     color: '#E84040' },
                            ].map(m => (
                              <span key={m.label} style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                <span style={{ color: m.color, fontWeight: 700 }}>{m.label}</span> {m.val}g
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: typeColor, padding: '2px 8px', borderRadius: 99, background: typeColor + '18' }}>
                            {log.type.toUpperCase()}
                          </span>
                          <p className="display" style={{ fontSize: 20, color: 'var(--text-primary)', marginTop: 4 }}>
                            {log.calories} <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>kcal</span>
                          </p>
                        </div>
                        <button onClick={() => deleteLog(log.id)}
                          style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', transition: 'color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
