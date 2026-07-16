import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [pantryRes, caloriesRes, spendingRes] = await Promise.all([
    supabase.from('pantry_items').select('name, quantity, unit').limit(30),
    supabase.from('calorie_logs').select('meal_name, calories').gte('logged_at', new Date().toISOString().split('T')[0]),
    supabase.from('spending_logs').select('amount, type').gte('date', new Date().toISOString().slice(0, 7) + '-01'),
  ])

  const pantryList = pantryRes.data?.map(p => `${p.name} (${p.quantity} ${p.unit})`).join(', ') || 'empty'
  const todayCalories = caloriesRes.data?.reduce((s, r) => s + r.calories, 0) ?? 0
  const grocerySpend = spendingRes.data?.filter(r => r.type === 'grocery').reduce((s, r) => s + r.amount, 0) ?? 0
  const eatingOutSpend = spendingRes.data?.filter(r => r.type === 'eating_out').reduce((s, r) => s + r.amount, 0) ?? 0

  const systemPrompt = `You are MealMind AI, a friendly meal prep and nutrition assistant.
User context:
- Pantry: ${pantryList}
- Today's calories: ${todayCalories} kcal
- This month: groceries $${grocerySpend.toFixed(2)}, eating out $${eatingOutSpend.toFixed(2)}

Help with meal planning, recipes, nutrition, and food budgeting. Be concise and practical.`

  const Groq = (await import('groq-sdk')).default
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    temperature: 0.7,
    max_tokens: 800,
  })

  const content = completion.choices[0].message.content ?? ''
  return NextResponse.json({ content })
}
