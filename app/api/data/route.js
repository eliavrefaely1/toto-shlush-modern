import { kv } from '@vercel/kv'

const KEY = 'toto:data:v1'

const defaultData = {
  currentWeek: 1,
  adminPassword: '1234',
  entryFee: 35,
  matches: [],
  users: [],
  userGuesses: [],
  pots: []
}

export async function GET() {
  try {
    const data = await kv.get(KEY)
    return Response.json(data || defaultData)
  } catch (err) {
    // אם אין KV מוגדר, נחזיר ברירת מחדל כדי שלא יישבר
    return Response.json(defaultData)
  }
}

export async function PUT(req) {
  try {
    const data = await req.json()
    await kv.set(KEY, data)
    return Response.json({ ok: true })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'KV not available' }), { status: 503 })
  }
}

