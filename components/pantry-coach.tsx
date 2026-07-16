'use client'
import { useState } from 'react'
import {
  Sparkles, Loader2, ChefHat, Check, ShoppingCart, Clock, Users, Flame, Lightbulb,
  ChevronDown, Sprout, Plus,
} from 'lucide-react'
import { Tilt } from '@/components/tilt'
import { useSupabase } from '@/lib/supabase/use-supabase'

type Idea = {
  title: string
  description: string
  uses: string[]
  missing: string[]
  readyToCook: boolean
  prepTime: string
  servings: number
  calories: number
  steps: string[]
}

export function PantryCoach() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(false)
  const [ran, setRan] = useState(false)
  const [tip, setTip] = useState('')
  const [guidance, setGuidance] = useState('')
  const [staples, setStaples] = useState<string[]>([])
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [addedIdeas, setAddedIdeas] = useState<Set<number>>(new Set())

  async function run() {
    setLoading(true); setError(''); setRan(true); setExpanded(null)
    try {
      const res = await fetch('/api/pantry-coach', { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTip(data.tip ?? '')
      setGuidance(data.guidance ?? '')
      setStaples(Array.isArray(data.suggestedStaples) ? data.suggestedStaples : [])
      setIdeas(Array.isArray(data.ideas) ? data.ideas : [])
    } catch {
      setError('Could not generate suggestions — please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Staples → Shopping list (you don't own them yet)
  async function addStaple(name: string) {
    if (!supabase || added.has(name)) return
    setAdded(prev => new Set(prev).add(name))
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('shopping_items').insert({
      name, user_id: user.id, checked: false, source: 'Coach staples',
    })
  }

  // An idea's "need to buy" items → Shopping list (tagged with the idea)
  async function addIdeaMissing(idea: Idea, i: number) {
    if (!supabase || !idea.missing?.length || addedIdeas.has(i)) return
    setAddedIdeas(prev => new Set(prev).add(i))
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const rows = idea.missing.map(name => ({
      name, user_id: user.id, checked: false, source: idea.title,
    }))
    await supabase.from('shopping_items').insert(rows)
  }

  return (
    <div className="fade-up" style={{ marginBottom: 20 }}>
      {/* Coach banner */}
      <div className="bento-cell" style={{
        display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
        borderColor: 'rgba(212,96,26,0.28)',
        background: 'linear-gradient(120deg, rgba(212,96,26,0.10) 0%, transparent 55%)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(212,96,26,0.16)', border: '1px solid rgba(212,96,26,0.3)',
          boxShadow: '0 0 22px rgba(212,96,26,0.25)',
        }}>
          <ChefHat size={22} color="#E8722B" strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>AI Meal Prep Coach</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.55 }}>
            AI scans your pantry, tells you what to cook now, and what to buy to unlock more meals.
          </p>
        </div>
        <button onClick={run} disabled={loading} className="app-btn" style={{ flexShrink: 0 }}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {loading ? 'Thinking…' : ran ? 'Regenerate' : 'Get Meal Prep Plan'}
        </button>
      </div>

      {error && (
        <div className="fade-up" style={{
          marginTop: 12, padding: '12px 16px', borderRadius: 12, fontSize: 13,
          background: 'rgba(240,80,80,0.1)', border: '1px solid rgba(240,80,80,0.25)', color: '#F05050',
        }}>
          {error}
        </div>
      )}

      {/* Sparse-pantry guidance + one-tap staples */}
      {guidance && !loading && (
        <div className="fade-up bento-cell" style={{
          marginTop: 12, borderColor: 'rgba(61,186,90,0.3)',
          background: 'linear-gradient(120deg, rgba(61,186,90,0.08) 0%, transparent 55%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Sprout size={18} color="#3DBA5A" strokeWidth={2} />
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Stock up to unlock more meals</p>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 14 }}>{guidance}</p>
          {staples.length > 0 && (
            <>
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                TAP TO ADD TO SHOPPING LIST
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {staples.map(s => {
                  const isAdded = added.has(s)
                  return (
                    <button
                      key={s}
                      onClick={() => addStaple(s)}
                      disabled={isAdded}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
                        padding: '6px 11px', borderRadius: 99, cursor: isAdded ? 'default' : 'pointer',
                        background: isAdded ? 'rgba(61,186,90,0.16)' : 'var(--bg-subtle)',
                        color: isAdded ? '#3DBA5A' : 'var(--text-secondary)',
                        border: `1px solid ${isAdded ? 'rgba(61,186,90,0.4)' : 'var(--border)'}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      {isAdded ? <Check size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={2.5} />}
                      {s}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tip */}
      {tip && !loading && (
        <div className="fade-up" style={{
          marginTop: 12, padding: '12px 16px', borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(232,168,48,0.08)', border: '1px solid rgba(232,168,48,0.22)',
        }}>
          <Lightbulb size={16} color="#E8A830" strokeWidth={2} style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid-3" style={{ marginTop: 14 }}>
          {[0, 1, 2].map(i => (
            <div key={i} className="bento-cell shimmer" style={{ height: 240, borderRadius: 18 }} />
          ))}
        </div>
      )}

      {/* Idea cards */}
      {!loading && ideas.length > 0 && (
        <div className="grid-3" style={{ marginTop: 14, alignItems: 'start' }}>
          {ideas.map((idea, i) => (
            <Tilt key={i} max={5}>
            <div className="bento-cell" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span className="tilt-spot" />

              {/* Status badge */}
              <span style={{
                alignSelf: 'flex-start',
                display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800,
                letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 99,
                background: idea.readyToCook ? 'rgba(61,186,90,0.16)' : 'rgba(232,114,43,0.16)',
                color: idea.readyToCook ? '#3DBA5A' : '#E8722B',
                border: `1px solid ${idea.readyToCook ? 'rgba(61,186,90,0.4)' : 'rgba(232,114,43,0.4)'}`,
              }}>
                {idea.readyToCook
                  ? <><Check size={11} strokeWidth={3} /> READY NOW</>
                  : <><ShoppingCart size={11} strokeWidth={2.5} /> NEEDS {idea.missing?.length ?? 0} ITEM{(idea.missing?.length ?? 0) === 1 ? '' : 'S'}</>}
              </span>

              <div>
                <p className="display" style={{ fontSize: 19, color: 'var(--text-primary)', lineHeight: 1.05, marginBottom: 6 }}>
                  {idea.title}
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {idea.description}
                </p>
              </div>

              {/* Meta chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <Meta icon={Clock} label={idea.prepTime} />
                <Meta icon={Users} label={`${idea.servings} servings`} />
                <Meta icon={Flame} label={`${idea.calories} kcal`} />
              </div>

              {idea.uses?.length > 0 && (
                <div>
                  <p style={lblStyle}>USES FROM PANTRY</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {idea.uses.map((u, j) => (
                      <span key={j} style={chip('#3DBA5A')}><Check size={10} strokeWidth={3} /> {u}</span>
                    ))}
                  </div>
                </div>
              )}

              {idea.missing?.length > 0 && (
                <div>
                  <p style={lblStyle}>NEED TO BUY</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                    {idea.missing.map((m, j) => (
                      <span key={j} style={chip('#E8722B')}><ShoppingCart size={10} strokeWidth={2.5} /> {m}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => addIdeaMissing(idea, i)}
                    disabled={addedIdeas.has(i)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
                      padding: '7px 13px', borderRadius: 10, width: '100%', justifyContent: 'center',
                      cursor: addedIdeas.has(i) ? 'default' : 'pointer',
                      background: addedIdeas.has(i) ? 'rgba(61,186,90,0.14)' : 'rgba(232,114,43,0.14)',
                      color: addedIdeas.has(i) ? '#3DBA5A' : '#E8722B',
                      border: `1px solid ${addedIdeas.has(i) ? 'rgba(61,186,90,0.4)' : 'rgba(232,114,43,0.4)'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    {addedIdeas.has(i)
                      ? <><Check size={13} strokeWidth={3} /> Added to shopping list</>
                      : <><ShoppingCart size={13} strokeWidth={2.5} /> Add {idea.missing.length} to shopping list</>}
                  </button>
                </div>
              )}

              {/* Recipe steps (expandable) */}
              {idea.steps?.length > 0 && (
                <div style={{ marginTop: 'auto' }}>
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
                      color: '#E8722B', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                    }}
                  >
                    {expanded === i ? 'Hide recipe' : 'View recipe'}
                    <ChevronDown size={14} style={{
                      transition: 'transform 0.25s', transform: expanded === i ? 'rotate(180deg)' : 'none',
                    }} />
                  </button>
                  {expanded === i && (
                    <ol className="fade-up" style={{
                      listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9,
                      marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--border)',
                    }}>
                      {idea.steps.map((s, j) => (
                        <li key={j} style={{ display: 'flex', gap: 9, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          <span style={{
                            width: 19, height: 19, borderRadius: 6, flexShrink: 0, marginTop: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 800, color: '#E8722B',
                            background: 'rgba(232,114,43,0.14)', border: '1px solid rgba(232,114,43,0.3)',
                          }}>{j + 1}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
            </Tilt>
          ))}
        </div>
      )}
    </div>
  )
}

const lblStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 6,
}

function Meta({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
      padding: '4px 9px', borderRadius: 8, color: 'var(--text-secondary)',
      background: 'var(--bg-subtle)', border: '1px solid var(--border)',
    }}>
      <Icon size={12} color="var(--text-tertiary)" /> {label}
    </span>
  )
}

function chip(color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
    padding: '4px 9px', borderRadius: 99,
    background: `${color}16`, color, border: `1px solid ${color}33`,
  }
}
