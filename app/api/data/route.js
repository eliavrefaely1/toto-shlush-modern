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
// Split-keys (progressive enhancement; keeps backward compatibility)
const META_KEY = 'toto:meta:v1'
const USERS_KEY = 'toto:users:v1'
const MATCHES_KEY = (w) => `toto:week:${w}:matches:v1`
const GUESSES_KEY = (w) => `toto:week:${w}:guesses:v1`

const defaultData = {
  currentWeek: 1,
  adminPassword: '1234',
  entryFee: 35,
  totoFirstPrize: 8000000,
  matches: [],
  users: [],
  userGuesses: [],
  pots: [],
  deletedWeeks: [],
  deletedGuessKeys: [],
  deletedUsers: [],
  countdownActive: false,
  countdownTarget: ''
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
          ADMIN_TOKEN: !!process.env.ADMIN_TOKEN,
        },
        kvOk,
        kvHasKey,
        key: KEY
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const raw = (await kv.get(KEY)) || defaultData
    // Optional filtering by week and fields to reduce payload
    const weekParam = searchParams.get('week')
    const fieldsParam = searchParams.get('fields') || searchParams.get('only')
    const wanted = fieldsParam ? new Set(fieldsParam.split(',').map(s => s.trim())) : null

    let data = raw
    // Shallow clone before mutating
    if (weekParam || wanted) {
      data = { ...raw }
    }

    if (weekParam) {
      const w = Number(weekParam)
      if (!Number.isNaN(w)) {
        // Try split-keys first for faster/smaller payload
        const [wkMatches, wkGuesses] = await Promise.all([
          kv.get(MATCHES_KEY(w)).catch(()=>null),
          kv.get(GUESSES_KEY(w)).catch(()=>null)
        ])
        if (Array.isArray(wkMatches)) {
          data.matches = wkMatches
        } else if (Array.isArray(raw.matches)) {
          data.matches = raw.matches.filter(m => Number(m.week) === w)
        } else {
          data.matches = []
        }

        if (Array.isArray(wkGuesses)) {
          data.userGuesses = wkGuesses
        } else if (Array.isArray(raw.userGuesses)) {
          data.userGuesses = raw.userGuesses.filter(g => Number(g.week) === w)
        } else {
          data.userGuesses = []
        }
      }
    }

    if (wanted) {
      const filtered = {}
      if (wanted.has('settings')) {
        const meta = await kv.get(META_KEY).catch(()=>null)
        filtered.currentWeek = meta?.currentWeek ?? raw.currentWeek
        filtered.adminPassword = meta?.adminPassword ?? raw.adminPassword
        filtered.entryFee = meta?.entryFee ?? raw.entryFee
        filtered.totoFirstPrize = meta?.totoFirstPrize ?? raw.totoFirstPrize ?? 8000000
        filtered.submissionsLocked = (meta?.submissionsLocked ?? raw.submissionsLocked) ?? false
        filtered.countdownActive = (meta?.countdownActive ?? raw.countdownActive) ?? false
        filtered.countdownTarget = meta?.countdownTarget ?? raw.countdownTarget ?? ''
      }
      if (wanted.has('matches')) filtered.matches = data.matches || []
      if (wanted.has('guesses') || wanted.has('userGuesses')) filtered.userGuesses = data.userGuesses || []
      if (wanted.has('users')) {
        const users = await kv.get(USERS_KEY).catch(()=>null)
        filtered.users = Array.isArray(users) ? users : (raw.users || [])
      }
      if (wanted.has('pots')) filtered.pots = raw.pots || []
      data = filtered
    }

    return Response.json(data, {
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
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.X_ADMIN_TOKEN
    const action = (req.headers.get('x-action') || '').toLowerCase()
    const token = req.headers.get('x-admin-token')

    // אבטחה: אם הוגדר טוקן בצד שרת — דרוש אותו בפעולות אדמין
    if (ADMIN_TOKEN && action === 'admin') {
      if (!token || token !== ADMIN_TOKEN) {
        return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 })
      }
    }

    // אכיפת נעילת הגשות: אם הנעילה פעילה כרגע, אל נאפשר שינוי userGuesses
    const toSave = { ...current, ...incoming }
    const incomingGuesses = Array.isArray(incoming.userGuesses) ? incoming.userGuesses : (current.userGuesses || [])
    const currentGuesses = Array.isArray(current.userGuesses) ? current.userGuesses : []
    if (current?.submissionsLocked) {
      // כאשר הגשה נעולה: נאפשר עדכונים ומחיקה, אך לא הוספה של משתתפים חדשים
      if (incomingGuesses.length > currentGuesses.length) {
        // חסום הוספה — שמור את הנוכחי
        toSave.userGuesses = currentGuesses
      } else {
        // עדכון/מחיקה מותר
        toSave.userGuesses = incomingGuesses
      }
    } else {
      toSave.userGuesses = incomingGuesses
    }

    // הגנה: אל תפעיל שעון ללא יעד תקין
    if (toSave.countdownActive && !toSave.countdownTarget) {
      toSave.countdownActive = false
    }
    await kv.set(KEY, toSave)

    // Also persist split-keys for faster targeted reads
    const metaToSave = {
      currentWeek: toSave.currentWeek ?? defaultData.currentWeek,
      adminPassword: toSave.adminPassword ?? defaultData.adminPassword,
      entryFee: toSave.entryFee ?? defaultData.entryFee,
      totoFirstPrize: toSave.totoFirstPrize ?? defaultData.totoFirstPrize,
      submissionsLocked: !!toSave.submissionsLocked,
      countdownActive: !!toSave.countdownActive,
      countdownTarget: toSave.countdownTarget || ''
    }
    try { await kv.set(META_KEY, metaToSave) } catch (_) {}

    if (Array.isArray(toSave.users)) {
      try { await kv.set(USERS_KEY, toSave.users) } catch (_) {}
    }

    const groupByWeek = (arr) => {
      const map = new Map()
      ;(Array.isArray(arr) ? arr : []).forEach(it => {
        const w = Number(it?.week)
        if (!Number.isNaN(w)) {
          if (!map.has(w)) map.set(w, [])
          map.get(w).push(it)
        }
      })
      return map
    }

    const matchesByWeek = groupByWeek(toSave.matches)
    for (const [w, list] of matchesByWeek.entries()) {
      try { await kv.set(MATCHES_KEY(w), list) } catch (_) {}
    }
    const guessesByWeek = groupByWeek(toSave.userGuesses)
    for (const [w, list] of guessesByWeek.entries()) {
      try { await kv.set(GUESSES_KEY(w), list) } catch (_) {}
    }
    return Response.json({ ok: true }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'KV not available' }), { status: 503 })
  }
}
