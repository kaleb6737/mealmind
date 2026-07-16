'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { Plus, Trash2, Loader2, Check, ShoppingCart, ArrowDown, Package } from 'lucide-react'
import { TopBar } from '@/components/top-bar'
import { SetupRequired } from '@/components/setup-required'

type Item = { id: string; name: string; checked: boolean; source?: string }

export default function ShoppingPage() {
  const supabase = useSupabase()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState('')
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const fetchItems = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('shopping_items').select('*')
      .order('checked').order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItem.trim() || !supabase) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('shopping_items').insert({ name: newItem.trim(), user_id: user!.id, checked: false })
    setNewItem('')
    setSaving(false)
    fetchItems()
  }

  async function toggleItem(id: string, checked: boolean) {
    if (!supabase) return
    await supabase.from('shopping_items').update({ checked: !checked }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !checked } : i))
  }

  async function deleteItem(id: string) {
    if (!supabase) return
    await supabase.from('shopping_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function clearChecked() {
    if (!supabase) return
    const ids = items.filter(i => i.checked).map(i => i.id)
    if (!ids.length) return
    await supabase.from('shopping_items').delete().in('id', ids)
    setItems(prev => prev.filter(i => !i.checked))
  }

  // Close the loop: bought item → into the pantry
  const [moving, setMoving] = useState<string | null>(null)
  async function moveToPantry(item: Item) {
    if (!supabase || moving) return
    setMoving(item.id)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('pantry_items').insert({
      name: item.name, quantity: '1', unit: 'pcs', category: 'Other', user_id: user!.id,
    })
    await supabase.from('shopping_items').delete().eq('id', item.id)
    setItems(prev => prev.filter(i => i.id !== item.id))
    setMoving(null)
  }

  const unchecked = items.filter(i => !i.checked)
  const checked = items.filter(i => i.checked)
  const progress = items.length > 0 ? checked.length / items.length : 0

  if (mounted && !supabase) return <SetupRequired />

  return (
    <div className="app-page">
      <TopBar subtitle="Your grocery shopping list" />
      <div className="app-content" style={{ maxWidth: 680 }}>

        {/* Header */}
        <div className="page-hd fade-up">
          <div>
            <p className="page-eyebrow">GROCERY</p>
            <h1 className="display page-title">SHOPPING LIST</h1>
            <p className="page-sub">
              {unchecked.length} item{unchecked.length !== 1 ? 's' : ''} remaining
            </p>
          </div>
          {checked.length > 0 && (
            <button
              onClick={clearChecked}
              className="app-btn fade-up"
              style={{
                background: 'transparent',
                color: 'var(--accent)',
                boxShadow: 'none',
                border: '1px solid var(--accent)',
              }}
            >
              Clear done ({checked.length})
            </button>
          )}
        </div>

        {/* Add-item bar */}
        <form onSubmit={addItem} className="flex gap-3 mb-5 fade-up delay-1">
          <input
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            placeholder="Add item to your list…"
            className="app-input flex-1"
          />
          <button type="submit" disabled={saving || !newItem.trim()} className="app-btn">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add
          </button>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : items.length === 0 ? (
          /* Empty state */
          <div className="empty-state fade-up delay-2">
            <div
              className="empty-icon"
              style={{
                background: 'var(--accent-subtle)',
                border: '1px solid rgba(212,96,26,0.2)',
                width: 64,
                height: 64,
                borderRadius: 20,
              }}
            >
              <ShoppingCart size={28} style={{ color: 'var(--accent)' }} />
            </div>
            <p
              className="display"
              style={{ fontSize: 'clamp(28px,5vw,38px)', color: 'var(--text-primary)', marginBottom: 8 }}
            >
              LIST IS EMPTY
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
              Add groceries above or generate them from a recipe
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-tertiary)' }}>
              <ArrowDown size={14} />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em' }}>TYPE ABOVE TO START</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 fade-up delay-2">

            {/* Progress card */}
            <div className="bento-cell" style={{ padding: '20px 22px', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(212,96,26,0.14)', border: '1px solid rgba(212,96,26,0.3)',
                    boxShadow: '0 0 18px rgba(212,96,26,0.2)',
                  }}>
                    <ShoppingCart size={19} color="#E8722B" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span className="display" style={{ fontSize: 34, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {checked.length}
                    </span>
                    <span style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                      / {items.length} done
                    </span>
                  </div>
                </div>
                {progress === 1 && items.length > 0 ? (
                  <span className="app-badge" style={{
                    background: 'rgba(61,186,90,0.14)', color: 'var(--green)',
                    border: '1px solid rgba(61,186,90,0.3)',
                  }}>
                    <Check size={11} strokeWidth={3} /> ALL DONE
                  </span>
                ) : (
                  <span className="display" style={{ fontSize: 22, color: '#E8722B', fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(progress * 100)}%
                  </span>
                )}
              </div>
              <div className="progress-track" style={{ height: 10 }}>
                <div className="progress-fill" style={{ width: `${progress * 100}%`, boxShadow: '0 0 12px rgba(212,96,26,0.5)' }} />
              </div>
            </div>

            {/* Unchecked items */}
            {unchecked.map((item, idx) => (
              <div
                key={item.id}
                className="bento-cell fade-up"
                style={{
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
                  animationDelay: `${0.14 + idx * 0.04}s`,
                }}
              >
                <button
                  onClick={() => toggleItem(item.id, item.checked)}
                  aria-label={`Mark ${item.name} as done`}
                  className="shop-check"
                  style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    border: '2px solid var(--border)', background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.18s',
                  }}
                >
                  <Check size={13} strokeWidth={3} style={{ color: '#E8722B', opacity: 0 }} className="shop-check-icon" />
                </button>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.name}
                  </span>
                  {item.source && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600,
                      padding: '3px 8px', borderRadius: 99, letterSpacing: '0.02em',
                      background: 'rgba(212,96,26,0.1)', color: '#E8A878',
                      border: '1px solid rgba(212,96,26,0.22)',
                    }}>
                      {item.source}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  aria-label={`Delete ${item.name}`}
                  style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(240,80,80,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'transparent' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* DONE divider */}
            {checked.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 2px' }}>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.18em',
                    color: 'var(--text-tertiary)', whiteSpace: 'nowrap',
                  }}>
                    DONE ({checked.length})
                  </span>
                  <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                </div>

                {/* Checked items */}
                {checked.map(item => (
                  <div
                    key={item.id}
                    className="bento-cell"
                    style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, opacity: 0.6 }}
                  >
                    <button
                      onClick={() => toggleItem(item.id, item.checked)}
                      aria-label={`Unmark ${item.name}`}
                      style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        border: '2px solid #D4601A',
                        background: 'linear-gradient(135deg, #D4601A, #E8722B)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: '0 0 12px rgba(212,96,26,0.4)',
                      }}
                    >
                      <Check size={13} color="white" strokeWidth={3} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                        {item.name}
                      </span>
                      {item.source && (
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 8 }}>
                          {item.source}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={() => moveToPantry(item)}
                        disabled={moving === item.id}
                        aria-label={`Move ${item.name} to pantry`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '6px 11px', borderRadius: 9, fontSize: 11, fontWeight: 700,
                          background: 'rgba(61,186,90,0.14)', color: 'var(--green)',
                          border: '1px solid rgba(61,186,90,0.32)', cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {moving === item.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : <Package size={12} />}
                        To pantry
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        aria-label={`Delete ${item.name}`}
                        style={{
                          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
