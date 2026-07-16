'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { TopBar } from '@/components/top-bar'
import {
  Plus, Trash2, Search, Loader2, X,
  Leaf, Milk, Beef, Wheat, Archive, Snowflake, Coffee, Box, Package,
} from 'lucide-react'
import { SetupRequired } from '@/components/setup-required'
import { PantryCoach } from '@/components/pantry-coach'

const CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Grains', 'Pantry', 'Frozen', 'Beverages', 'Other']

const CAT_COLORS: Record<string, string> = {
  Produce:   '#3DBA5A',
  Dairy:     '#4DA3E8',
  Meat:      '#E84040',
  Grains:    '#E8A830',
  Pantry:    '#8B5CF6',
  Frozen:    '#22D3EE',
  Beverages: '#EC4899',
  Other:     '#888888',
}

const CAT_ICONS: Record<string, React.ElementType> = {
  Produce:   Leaf,
  Dairy:     Milk,
  Meat:      Beef,
  Grains:    Wheat,
  Pantry:    Archive,
  Frozen:    Snowflake,
  Beverages: Coffee,
  Other:     Box,
}

type Item = { id: string; name: string; quantity: string; category: string; unit: string }

export default function PantryPage() {
  const supabase = useSupabase()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const [items, setItems]         = useState<Item[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showAdd, setShowAdd]     = useState(false)
  const [form, setForm]           = useState({ name: '', quantity: '1', unit: 'pcs', category: 'Other' })
  const [saving, setSaving]       = useState(false)
  const [filterCat, setFilterCat] = useState('All')

  const fetchItems = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase.from('pantry_items').select('*').order('category').order('name')
    setItems(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('pantry_items').insert({ ...form, user_id: user!.id })
    setForm({ name: '', quantity: '1', unit: 'pcs', category: 'Other' })
    setShowAdd(false)
    setSaving(false)
    fetchItems()
  }

  async function deleteItem(id: string) {
    if (!supabase) return
    await supabase.from('pantry_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) &&
    (filterCat === 'All' || i.category === filterCat)
  )

  if (mounted && !supabase) return <SetupRequired />

  return (
    <div className="app-page">
      <TopBar subtitle="Manage your ingredients" />

      <div className="app-content">

        {/* ── Page header: title + search + add button ──────────────────────── */}
        <div className="fade-up" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 20, flexWrap: 'wrap',
        }}>
          {/* Title block */}
          <div style={{ flex: '0 0 auto' }}>
            <p className="page-eyebrow">INVENTORY</p>
            <h1 className="page-title" style={{ lineHeight: 1 }}>PANTRY</h1>
          </div>

          {/* Search bar — grows to fill space */}
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)', pointerEvents: 'none',
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search pantry…"
              className="app-input"
              style={{ paddingLeft: 38, width: '100%' }}
            />
          </div>

          {/* Item count badge */}
          <span className="app-badge" style={{ flexShrink: 0, fontSize: 12, padding: '6px 12px' }}>
            {items.length} items
          </span>

          {/* Add / Cancel button */}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="app-btn"
            style={{ flexShrink: 0 }}
          >
            {showAdd ? <X size={15} /> : <Plus size={15} />}
            {showAdd ? 'Cancel' : 'Add Item'}
          </button>
        </div>

        {/* ── Slide-in add form ─────────────────────────────────────────────── */}
        {showAdd && (
          <form onSubmit={addItem} className="app-card fade-up" style={{
            padding: '22px 24px', marginBottom: 20,
            border: '1px solid rgba(212,96,26,0.4)',
            background: 'linear-gradient(135deg, rgba(212,96,26,0.06) 0%, transparent 60%)',
          }}>
            {/* Form title */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: '#D4601A',
                boxShadow: '0 0 8px rgba(212,96,26,0.7)',
              }} />
              <p style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
                color: '#D4601A',
              }}>NEW ITEM</p>
            </div>

            {/* 2-column grid of inputs */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            }}>
              {/* Item name — full row */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 6,
                }}>ITEM NAME *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Chicken Breast"
                  className="app-input"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Quantity */}
              <div>
                <label style={{
                  display: 'block', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 6,
                }}>QUANTITY</label>
                <input
                  value={form.quantity}
                  onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                  placeholder="1"
                  className="app-input"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Unit */}
              <div>
                <label style={{
                  display: 'block', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 6,
                }}>UNIT</label>
                <input
                  value={form.unit}
                  onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                  placeholder="pcs, kg, L…"
                  className="app-input"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Category */}
              <div>
                <label style={{
                  display: 'block', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.12em', color: 'var(--text-tertiary)', marginBottom: 6,
                }}>CATEGORY</label>
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="app-select"
                  style={{ width: '100%' }}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Save button */}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" disabled={saving} className="app-btn" style={{ width: '100%' }}>
                  {saving
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Plus size={14} />
                  }
                  {saving ? 'Saving…' : 'Save Item'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── AI Meal Prep Coach ────────────────────────────────────────────── */}
        <PantryCoach />

        {/* ── Category filter pills ─────────────────────────────────────────── */}
        <div className="fade-up delay-1" style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          paddingBottom: 6, marginBottom: 20, scrollbarWidth: 'none',
        }}>
          {['All', ...CATEGORIES].map(cat => {
            const CatIcon   = cat !== 'All' ? CAT_ICONS[cat] : Package
            const catColor  = cat !== 'All' ? CAT_COLORS[cat] : 'var(--accent)'
            const isActive  = filterCat === cat
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`cat-pill${isActive ? ' active' : ''}`}
                style={{
                  flexShrink: 0,
                  ...(isActive && cat !== 'All' ? {
                    background: `${catColor}20`,
                    borderColor: `${catColor}50`,
                    color: catColor,
                  } : {}),
                }}
              >
                <CatIcon
                  size={12}
                  color={isActive
                    ? (cat !== 'All' ? catColor : 'var(--accent)')
                    : catColor
                  }
                  strokeWidth={2}
                />
                {cat}
              </button>
            )
          })}
        </div>

        {/* ── Items grid / states ───────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state fade-up">
            <div className="empty-icon">
              <Package size={32} color="var(--text-tertiary)" strokeWidth={1.5} />
            </div>
            <p className="display" style={{ fontSize: 36, color: 'var(--text-tertiary)', marginBottom: 8 }}>
              EMPTY
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20, lineHeight: 1.5 }}>
              {search || filterCat !== 'All'
                ? 'No items match your filter.'
                : 'Your pantry is empty. Add your first ingredient to get started.'
              }
            </p>
            {!search && filterCat === 'All' && (
              <button
                onClick={() => setShowAdd(true)}
                className="app-btn"
                style={{ fontSize: 13 }}
              >
                <Plus size={14} />
                Add First Item
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}>
            {filtered.map((item, idx) => {
              const color   = CAT_COLORS[item.category] ?? '#888'
              const CatIcon = CAT_ICONS[item.category]  ?? Box
              const delay   = `delay-${Math.min(idx % 6 + 1, 6)}` as string
              return (
                <div
                  key={item.id}
                  className={`app-card app-card-hover fade-up ${delay}`}
                  style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}
                >
                  {/* Top color accent line */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, ${color}60 0%, transparent 80%)`,
                    borderRadius: '4px 4px 0 0',
                  }} />

                  {/* Header: icon circle + delete */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${color}18`, border: `1.5px solid ${color}35`,
                      flexShrink: 0,
                    }}>
                      <CatIcon size={20} color={color} strokeWidth={2} />
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      aria-label={`Delete ${item.name}`}
                      style={{
                        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(232,64,64,0.08)',
                        border: '1px solid rgba(232,64,64,0.18)',
                        cursor: 'pointer',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget
                        el.style.background = 'rgba(232,64,64,0.2)'
                        el.style.borderColor = 'rgba(232,64,64,0.4)'
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget
                        el.style.background = 'rgba(232,64,64,0.08)'
                        el.style.borderColor = 'rgba(232,64,64,0.18)'
                      }}
                    >
                      <Trash2 size={13} color="#E84040" />
                    </button>
                  </div>

                  {/* Item name */}
                  <p style={{
                    fontWeight: 700, fontSize: 14,
                    color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 8,
                  }}>
                    {item.name}
                  </p>

                  {/* Footer: qty badge + category */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span className="app-badge" style={{
                      background: `${color}18`,
                      color,
                      borderColor: `${color}35`,
                      fontSize: 10,
                    }}>
                      {item.category}
                    </span>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className="display" style={{
                        fontSize: 18, lineHeight: 1, color: 'var(--text-primary)',
                      }}>
                        {item.quantity}
                      </span>
                      <span style={{
                        fontSize: 10, color: 'var(--text-tertiary)',
                        marginLeft: 4,
                      }}>
                        {item.unit}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
