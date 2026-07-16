'use client'

export function SetupRequired() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, #D4601A, #E8722B)' }}>
        <span className="display text-2xl text-white">!</span>
      </div>
      <p className="display text-4xl mb-3" style={{ color: 'var(--text-primary)' }}>SETUP REQUIRED</p>
      <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Create a <code className="px-1.5 py-0.5 rounded text-xs font-mono"
          style={{ background: 'var(--bg-subtle)', color: 'var(--accent)' }}>.env.local</code> file
        in your project root with your Supabase credentials.
      </p>
      <div className="rounded-xl p-4 text-left font-mono text-xs w-full max-w-md"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
        <p style={{ color: 'var(--text-tertiary)' }}># .env.local</p>
        <p><span style={{ color: 'var(--accent)' }}>NEXT_PUBLIC_SUPABASE_URL</span>=your_url</p>
        <p><span style={{ color: 'var(--accent)' }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>=your_key</p>
        <p><span style={{ color: 'var(--accent)' }}>GROQ_API_KEY</span>=your_groq_key</p>
      </div>
      <p className="text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
        Then restart the dev server with <code className="font-mono">npm run dev</code>
      </p>
    </div>
  )
}
