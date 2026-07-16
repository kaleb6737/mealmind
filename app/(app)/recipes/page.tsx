'use client'
import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { TopBar } from '@/components/top-bar'
import { SetupRequired } from '@/components/setup-required'
import {
  Loader2, Clock, Users, Flame, ShoppingCart,
  CheckCircle, XCircle, Sparkles, ChevronDown, ChefHat, Brain,
} from 'lucide-react'

type Ingredient = { name: string; amount: string; have: boolean }
type Recipe = {
  title: string; description: string; time: string; servings: number
  calories_per_serving: number; ingredients: Ingredient[]; steps: string[]
  missing_ingredients: string[]
}

const PREFS = ['High Protein', 'Quick & Easy', 'Vegetarian', 'Budget', 'Keto']

const BAND_THEMES = [
  { gradient: 'linear-gradient(135deg, #D4601A 0%, #E8722B 60%, #BF5516 100%)', glow: 'rgba(212,96,26,0.35)' },
  { gradient: 'linear-gradient(135deg, #B83030 0%, #E84040 60%, #9A2020 100%)', glow: 'rgba(232,64,64,0.3)' },
  { gradient: 'linear-gradient(135deg, #2D7A3A 0%, #3DBA5A 60%, #1E5527 100%)', glow: 'rgba(61,186,90,0.3)' },
]

const DELAY_CLASSES = ['', 'delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5', 'delay-6']

export default function RecipesPage() {
  const supabase = useSupabase()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const [preferences, setPreferences] = useState('')
  const [activePref, setActivePref] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [savingList, setSavingList] = useState<number | null>(null)

  async function generate(pref?: string) {
    const finalPref = pref ?? preferences
    setLoading(true)
    setRecipes([])
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: finalPref }),
    })
    const data = await res.json()
    setRecipes(data.recipes ?? [])
    setLoading(false)
  }

  async function saveToShoppingList(recipe: Recipe, idx: number) {
    if (!supabase) return
    setSavingList(idx)
    const { data: { user } } = await supabase.auth.getUser()
    const items = recipe.missing_ingredients.map(name => ({
      name, user_id: user!.id, checked: false, source: recipe.title
    }))
    if (items.length) await supabase.from('shopping_items').insert(items)
    setSavingList(null)
  }

  if (mounted && !supabase) return <SetupRequired />

  return (
    <div className="app-page">
      <TopBar subtitle="AI-generated from your pantry" />

      <div className="app-content app-content-wide">

        {/* Page header */}
        <div className="page-hd fade-up">
          <div>
            <p className="page-eyebrow">AI POWERED</p>
            <h1 className="display page-title">RECIPES</h1>
            <p className="page-sub">Personalized meals built from your pantry</p>
          </div>
          <button
            onClick={() => generate()}
            disabled={loading}
            className="app-btn"
            style={{ gap: 8, padding: '11px 22px' }}
          >
            {loading
              ? <Loader2 size={15} className="animate-spin" />
              : <Brain size={15} />}
            Generate
          </button>
        </div>

        {/* Generator card */}
        <div
          className="app-card fade-up delay-1"
          style={{
            padding: '22px 24px',
            marginBottom: 20,
            background: 'linear-gradient(160deg, var(--bg-card) 0%, var(--bg-subtle) 100%)',
            borderColor: 'rgba(212,96,26,0.15)',
          }}
        >
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
            color: 'var(--text-tertiary)', marginBottom: 14,
          }}>
            DIETARY PREFERENCES
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {PREFS.map(p => (
              <button
                key={p}
                className={`cat-pill${activePref === p ? ' active' : ''}`}
                onClick={() => {
                  const next = p === activePref ? '' : p
                  setActivePref(next)
                  setPreferences(next)
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              value={preferences}
              onChange={e => { setPreferences(e.target.value); setActivePref('') }}
              placeholder="Or describe what you want — e.g. 'high protein pasta under 30 min'"
              className="app-input"
              style={{ flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && generate()}
            />
            <button
              onClick={() => generate()}
              disabled={loading}
              className="app-btn"
              style={{ flexShrink: 0 }}
            >
              {loading
                ? <Loader2 size={15} className="animate-spin" />
                : <Sparkles size={15} />}
              {loading ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3].map(n => (
              <div key={n} className="app-card" style={{ overflow: 'hidden', height: 148, borderRadius: 20 }}>
                <div className="shimmer" style={{ height: 6, width: '100%' }} />
                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="shimmer" style={{ height: 22, width: `${50 + n * 12}%`, borderRadius: 6 }} />
                  <div className="shimmer" style={{ height: 13, width: '70%', borderRadius: 5 }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {[60, 80, 56].map((w, j) => (
                      <div key={j} className="shimmer" style={{ height: 22, width: w, borderRadius: 99 }} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && recipes.length === 0 && (
          <div className="empty-state fade-up delay-2">
            <div className="empty-icon" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
              <ChefHat size={28} />
            </div>
            <p className="display" style={{ fontSize: 30, color: 'var(--text-tertiary)', marginBottom: 8 }}>
              WHAT&apos;S COOKING?
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 280, lineHeight: 1.6 }}>
              Pick a preference or describe what you want, then hit Generate
            </p>
          </div>
        )}

        {/* Recipe cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {recipes.map((recipe, i) => {
            const theme = BAND_THEMES[i % BAND_THEMES.length]
            const hasMissing = (recipe.missing_ingredients?.length ?? 0) > 0
            const isOpen = expanded === i
            const delayClass = DELAY_CLASSES[Math.min(i, DELAY_CLASSES.length - 1)]
            const previewIngredients = recipe.ingredients?.slice(0, 4) ?? []

            return (
              <div
                key={i}
                className={`app-card card-3d fade-up ${delayClass}`}
                style={{ overflow: 'hidden' }}
              >
                {/* Colored header band */}
                <div style={{
                  height: 5,
                  background: theme.gradient,
                  boxShadow: `0 2px 16px ${theme.glow}`,
                }} />

                {/* Card body */}
                <div
                  style={{ padding: '20px 22px 0', cursor: 'pointer' }}
                  onClick={() => setExpanded(isOpen ? null : i)}
                >
                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <h3
                      className="display"
                      style={{ fontSize: 26, lineHeight: 1.05, color: 'var(--text-primary)', flex: 1, paddingRight: 16 }}
                    >
                      {recipe.title.toUpperCase()}
                    </h3>
                    <ChevronDown
                      size={16}
                      style={{
                        color: 'var(--text-tertiary)', flexShrink: 0,
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease', marginTop: 4,
                      }}
                    />
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55,
                    marginBottom: 14, maxWidth: 600,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {recipe.description}
                  </p>

                  {/* Stats row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                    <span className="app-badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                      <Clock size={10} /> {recipe.time}
                    </span>
                    <span className="app-badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                      <Users size={10} /> {recipe.servings} servings
                    </span>
                    <span className="app-badge" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                      <Flame size={10} /> {recipe.calories_per_serving} kcal
                    </span>
                    {hasMissing && (
                      <span className="app-badge" style={{ background: 'var(--yellow-subtle)', color: 'var(--yellow)' }}>
                        {recipe.missing_ingredients.length} missing
                      </span>
                    )}
                  </div>

                  {/* Ingredient preview chips */}
                  {previewIngredients.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                      {previewIngredients.map((ing, j) => (
                        <span
                          key={j}
                          style={{
                            fontSize: 11, padding: '3px 10px', borderRadius: 99,
                            background: ing.have ? 'var(--green-subtle)' : 'var(--bg-subtle)',
                            color: ing.have ? 'var(--green)' : 'var(--text-tertiary)',
                            border: `1px solid ${ing.have ? 'rgba(61,186,90,0.2)' : 'var(--border)'}`,
                            fontWeight: 500,
                          }}
                        >
                          {ing.name}
                        </span>
                      ))}
                      {(recipe.ingredients?.length ?? 0) > 4 && (
                        <span style={{
                          fontSize: 11, padding: '3px 10px', borderRadius: 99,
                          background: 'var(--bg-subtle)', color: 'var(--text-tertiary)',
                          border: '1px solid var(--border)', fontWeight: 500,
                        }}>
                          +{recipe.ingredients.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{
                  display: 'flex', gap: 10, padding: '0 22px 20px',
                }}>
                  {hasMissing && (
                    <button
                      onClick={e => { e.stopPropagation(); saveToShoppingList(recipe, i) }}
                      disabled={savingList === i}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 7, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600,
                        background: 'var(--bg-subtle)', color: 'var(--text-primary)',
                        border: '1px solid var(--border)', cursor: 'pointer',
                        opacity: savingList === i ? 0.5 : 1, transition: 'opacity 0.15s',
                      }}
                    >
                      {savingList === i
                        ? <Loader2 size={13} className="animate-spin" />
                        : <ShoppingCart size={13} />}
                      Add Missing to Cart
                    </button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); setExpanded(isOpen ? null : i) }}
                    className="app-btn"
                    style={{ flex: 1 }}
                  >
                    {isOpen ? 'Close Recipe' : 'View Recipe'}
                  </button>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    padding: '22px 22px 24px',
                    background: 'linear-gradient(180deg, var(--bg-subtle) 0%, var(--bg-card) 100%)',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>

                      {/* Ingredients */}
                      <div>
                        <p style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                          color: 'var(--text-tertiary)', marginBottom: 14,
                        }}>INGREDIENTS</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                          {recipe.ingredients?.map((ing, j) => (
                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              {ing.have
                                ? <CheckCircle size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
                                : <XCircle size={14} style={{ color: 'var(--red)', flexShrink: 0 }} />}
                              <span style={{
                                fontSize: 13, lineHeight: 1.4,
                                color: ing.have ? 'var(--text-primary)' : 'var(--text-tertiary)',
                              }}>
                                <span style={{ fontWeight: 600 }}>{ing.amount}</span> {ing.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Steps */}
                      <div>
                        <p style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                          color: 'var(--text-tertiary)', marginBottom: 14,
                        }}>STEPS</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {recipe.steps?.map((step, j) => (
                            <div key={j} style={{ display: 'flex', gap: 12 }}>
                              <span
                                className="display"
                                style={{
                                  fontSize: 18, color: 'var(--accent)', flexShrink: 0,
                                  lineHeight: 1.3, minWidth: 20, textAlign: 'right',
                                }}
                              >
                                {j + 1}
                              </span>
                              <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)', margin: 0 }}>
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
