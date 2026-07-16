import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: pantry } = await supabase
    .from('pantry_items').select('name, quantity, unit, category').eq('user_id', user.id)

  const pantryCount = pantry?.length ?? 0
  const pantryList = pantry?.map(p => `${p.name} (${p.quantity} ${p.unit})`).join(', ') || 'empty pantry'
  const sparse = pantryCount < 5

  const Groq = (await import('groq-sdk')).default
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          `You are MealMind's meal-prep coach. You help users decide what to batch-prep from their pantry, and guide them to buy a few things to unlock more desirable meals. ` +
          `Return JSON only, no markdown: { "tip": string, "guidance": string, "suggestedStaples": string[], "ideas": [ { "title": string, "description": string, "uses": string[], "missing": string[], "readyToCook": boolean, "prepTime": string, "servings": number, "calories": number, "steps": string[] } ] }. ` +
          `Provide exactly 3 ideas. RULES: ` +
          `1) When feasible, at least ONE idea must use ONLY current pantry items (readyToCook=true, missing=[]). ` +
          `2) The other ideas may require buying up to 4 extra ingredients (listed in "missing") to inspire more desirable meals. ` +
          `3) "readyToCook" = true ONLY if "missing" is empty. ` +
          `4) Every idea MUST include "steps": 3-6 short, real cooking steps so the user can actually make it. ` +
          `5) "uses" = the pantry items the idea uses. ` +
          `6) "tip" = one short actionable tip personalized to their pantry. ` +
          `7) If the pantry has fewer than 5 items, set "guidance" to a friendly 2-sentence nudge that their pantry is sparse and a few staples unlock far more meals, and set "suggestedStaples" to 6-10 versatile staple ingredients to add (single words/short names). Otherwise set "guidance" to "" and "suggestedStaples" to [].`,
      },
      {
        role: 'user',
        content: `Pantry (${pantryCount} items): ${pantryList}\nThe pantry is ${sparse ? 'SPARSE (under 5 items) — include guidance and suggestedStaples, and lean toward "build-up" ideas that recommend buying a few staples.' : 'reasonably stocked — focus on what they can make now.'}\nReturn the JSON only.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2200,
  })

  try {
    const text = completion.choices[0].message.content ?? '{}'
    const data = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to parse suggestions' }, { status: 500 })
  }
}
