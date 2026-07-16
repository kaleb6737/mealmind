import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { preferences } = await req.json()
  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: pantry } = await supabase
    .from('pantry_items').select('name, quantity, unit').eq('user_id', user.id)

  const Groq = (await import('groq-sdk')).default
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const pantryList = pantry?.map(p => `${p.name} (${p.quantity} ${p.unit})`).join(', ') || 'empty pantry'

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are a meal prep expert. Return exactly 3 recipes as a JSON array. Each recipe: { title, description, time, servings, calories_per_serving, ingredients: [{name, amount, have}], steps: [string], missing_ingredients: [string] }. have=true if in pantry.',
      },
      {
        role: 'user',
        content: `Pantry: ${pantryList}\nPreferences: ${preferences || 'none'}\nReturn 3 meal prep recipes as JSON array only, no markdown.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  try {
    const text = completion.choices[0].message.content ?? '[]'
    const recipes = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    return NextResponse.json({ recipes })
  } catch {
    return NextResponse.json({ error: 'Failed to parse recipes' }, { status: 500 })
  }
}
