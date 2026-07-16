'use client'
import { useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient | null {
  if (!url || !key) return null
  if (!_client) _client = createBrowserClient(url, key)
  return _client
}

export function useSupabase(): SupabaseClient | null {
  const ref = useRef<SupabaseClient | null>(null)
  if (typeof window !== 'undefined' && !ref.current) {
    ref.current = getClient()
  }
  return ref.current
}
