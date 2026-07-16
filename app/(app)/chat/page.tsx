'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

type Message = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'What can I make with my pantry?',
  'How can I cut my grocery bill?',
  'Give me a high-protein meal plan',
  "What's my calorie intake today?",
]

/* Keyframes injected once as a style tag */
const STYLES = `
@keyframes dot-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40%            { transform: translateY(-6px); opacity: 1; }
}
@keyframes live-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(61,186,90,0.5); }
  50%       { box-shadow: 0 0 0 5px rgba(61,186,90,0); }
}
.typing-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--accent);
  animation: dot-bounce 1.2s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
.live-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--green);
  animation: live-pulse 2s ease-in-out infinite;
}
`

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* Auto-grow textarea */
  const resizeTextarea = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'
  }, [])

  useEffect(() => { resizeTextarea() }, [input, resizeTextarea])

  async function sendMessage(text?: string) {
    const content = text ?? input.trim()
    if (!content || loading) return
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    })
    const data = await res.json()
    setMessages(prev => [...prev, { role: 'assistant', content: data.content ?? 'Something went wrong.' }])
    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

        {/* ── Sticky header ── */}
        <div
          className="flex items-center gap-4 flex-shrink-0"
          style={{
            padding: '14px 28px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-card)',
            position: 'sticky', top: 0, zIndex: 20,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div
            style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #D4601A, #E8722B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(212,96,26,0.35)',
            }}
          >
            <Brain size={18} color="white" />
          </div>
          <div>
            <p
              className="display"
              style={{ fontSize: 18, letterSpacing: '0.06em', color: 'var(--text-primary)', lineHeight: 1 }}
            >
              MEALMIND AI
            </p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)', marginTop: 3 }}>
              Powered by Groq llama-3.3
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="live-dot" />
            <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>Online</span>
          </div>
        </div>

        {/* ── Scrollable message area ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {messages.length === 0 ? (

            /* Empty state */
            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: '100%', gap: 28, paddingBottom: 40,
              }}
            >
              {/* Glowing Brain icon */}
              <div
                style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(212,96,26,0.18) 0%, rgba(212,96,26,0.06) 60%, transparent 100%)',
                  border: '1px solid rgba(212,96,26,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(212,96,26,0.2), 0 0 80px rgba(212,96,26,0.08)',
                }}
              >
                <Brain size={36} style={{ color: 'var(--accent)' }} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <p
                  className="display"
                  style={{
                    fontSize: 'clamp(36px, 6vw, 52px)',
                    color: 'var(--text-primary)', marginBottom: 10, lineHeight: 1,
                  }}
                >
                  ASK ANYTHING
                </p>
                <p
                  style={{
                    fontSize: 14, color: 'var(--text-secondary)',
                    lineHeight: 1.65, maxWidth: 340, margin: '0 auto',
                  }}
                >
                  I know your pantry, today&apos;s nutrition, and spending habits.
                  Ask about meals, recipes, or your budget.
                </p>
              </div>

              {/* Suggestion pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 480 }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="cat-pill"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

          ) : (

            /* Message list */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700, margin: '0 auto' }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  style={{ alignItems: 'flex-end', gap: 10 }}
                >
                  {/* AI avatar */}
                  {msg.role === 'assistant' && (
                    <div
                      style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        background: 'linear-gradient(135deg, #D4601A, #E8722B)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 2,
                        boxShadow: '0 0 12px rgba(212,96,26,0.3)',
                      }}
                    >
                      <Brain size={14} color="white" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    style={{
                      maxWidth: '78%',
                      padding: '12px 16px',
                      borderRadius: 18,
                      fontSize: 14,
                      lineHeight: 1.65,
                      ...(msg.role === 'user'
                        ? {
                            background: 'linear-gradient(135deg, #D4601A, #E8722B)',
                            color: 'white',
                            borderBottomRightRadius: 4,
                            boxShadow: '0 2px 16px rgba(212,96,26,0.28)',
                          }
                        : {
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                            borderBottomLeftRadius: 4,
                          }
                      ),
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: 'linear-gradient(135deg, #D4601A, #E8722B)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 12px rgba(212,96,26,0.3)',
                    }}
                  >
                    <Brain size={14} color="white" />
                  </div>
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: 18,
                      borderBottomLeftRadius: 4,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── Fixed input bar ── */}
        <div
          style={{
            flexShrink: 0,
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-card)',
            padding: '16px 28px',
          }}
        >
          <div
            style={{
              display: 'flex', gap: 10, maxWidth: 700, margin: '0 auto',
              alignItems: 'flex-end',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about meals, nutrition, budget… (Shift+Enter for newline)"
              rows={1}
              className="app-input flex-1"
              style={{
                resize: 'none',
                overflow: 'hidden',
                padding: '12px 16px',
                fontSize: 14,
                lineHeight: 1.5,
                minHeight: 46,
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="app-btn"
              style={{
                width: 46, height: 46, padding: 0,
                flexShrink: 0, borderRadius: 14,
              }}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
