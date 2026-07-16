import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { meal } = await req.json()
  if (!meal?.trim()) return NextResponse.json({ error: 'No meal provided' }, { status: 400 })

  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const Groq = (await import('groq-sdk')).default
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a professional nutritionist with expertise in food databases (USDA, MyFitnessPal).
Estimate nutritional content for any food or meal description.

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanation, no extra text — just the JSON object.
Format: {"calories":<integer>,"protein":<integer>,"carbs":<integer>,"fat":<integer>}

Rules:
- Estimate for one typical serving unless quantity is specified
- Calories should equal roughly (protein*4 + carbs*4 + fat*9)
- Round all values to nearest integer
- Be accurate based on standard nutritional data`,
      },
      {
        role: 'user',
        content: `Estimate nutrition for: ${meal}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 80,
  })

  const text = (completion.choices[0].message.content ?? '').trim()
  try {
    const match = text.match(/\{[\s\S]*?\}/)
    const parsed = JSON.parse(match ? match[0] : text)
    return NextResponse.json({
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      protein:  Math.max(0, Math.round(Number(parsed.protein)  || 0)),
      carbs:    Math.max(0, Math.round(Number(parsed.carbs)    || 0)),
      fat:      Math.max(0, Math.round(Number(parsed.fat)      || 0)),
    })
  } catch {
    return NextResponse.json({ error: 'AI returned unexpected format' }, { status: 500 })
  }
}
