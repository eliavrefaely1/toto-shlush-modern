import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

// Ensure fresh responses
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Lazy init Redis only if env exists, and never throw at import time
let redis = null
try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = Redis.fromEnv()
  }
} catch (_) {
  redis = null
}

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

export const POST = async () => {
  try {
    if (!redis) return new NextResponse(JSON.stringify({ ok: false, error: 'Redis not configured' }), { status: 503 })
    const result = await redis.get('item')
    return new NextResponse(JSON.stringify({ result }), { status: 200 })
  } catch (e) {
    return new NextResponse(JSON.stringify({ ok: false, error: 'Redis error' }), { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    if (searchParams.get('diag') === '1') {
      // החזר סטטוס משתני סביבה ואיתור המפתח ב‑KV כדי לאבחן
      let kvOk = false
      let kvHasKey = false
      try {
        const probe = await kv.get(KEY)
        kvOk = true
        kvHasKey = !!probe && typeof probe === 'object' && Object.keys(probe).length > 0
      } catch (_) {}

      return Response.json({
        ok: true,
        env: {
          KV_URL: !!process.env.KV_URL,
          KV_REST_API_URL: !!process.env.KV_REST_API_URL,
          KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
          KV_REST_API_READ_ONLY_TOKEN: !!process.env.KV_REST_API_READ_ONLY_TOKEN,
          UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
          UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        },
        kvOk,
        kvHasKey,
        key: KEY
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const data = await kv.get(KEY)
    return Response.json(data || defaultData, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (err) {
    // אם אין KV מוגדר, נחזיר ברירת מחדל כדי שלא יישבר
    return Response.json(defaultData, {
      headers: { 'Cache-Control': 'no-store' }
    })
  }
}

export async function PUT(req) {
  try {
    const incoming = await req.json()
    const current = (await kv.get(KEY)) || defaultData

    // אכיפת נעילת הגשות: אם הנעילה פעילה כרגע, אל נאפשר שינוי userGuesses
    const toSave = { ...current, ...incoming }
    if (current?.submissionsLocked) {
      toSave.userGuesses = current.userGuesses || []
    }

    await kv.set(KEY, toSave)
    return Response.json({ ok: true }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'KV not available' }), { status: 503 })
  }
}
