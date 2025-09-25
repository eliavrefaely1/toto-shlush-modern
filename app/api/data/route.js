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

export const POST = async (req) => {
  try {
    const { action } = await req.json()
    
    if (action === 'status') {
      // בדיקת סטטוס הטבלאות
      const raw = (await kv.get(KEY)) || defaultData
      const meta = await kv.get(META_KEY).catch(()=>null)
      const users = await kv.get(USERS_KEY).catch(()=>null)
      
      let status = {
        mainTable: {
          size: JSON.stringify(raw).length,
          users: raw.users?.length || 0,
          matches: raw.matches?.length || 0,
          guesses: raw.userGuesses?.length || 0
        },
        splitTables: {
          meta: meta ? JSON.stringify(meta).length : 0,
          users: users ? JSON.stringify(users).length : 0
        },
        issues: []
      }
      
      // בדיקת בעיות
      if (Array.isArray(raw.users)) {
        const userIds = new Set()
        const duplicateUsers = raw.users.filter(u => {
          if (!u.id || userIds.has(u.id)) return true
          userIds.add(u.id)
          return false
        })
        if (duplicateUsers.length > 0) {
          status.issues.push(`${duplicateUsers.length} משתמשים כפולים`)
        }
      }
      
      if (Array.isArray(raw.userGuesses)) {
        const guessIds = new Set()
        const duplicateGuesses = raw.userGuesses.filter(g => {
          if (!g.id || guessIds.has(g.id)) return true
          guessIds.add(g.id)
          return false
        })
        if (duplicateGuesses.length > 0) {
          status.issues.push(`${duplicateGuesses.length} ניחושים כפולים`)
        }
      }
      
      if (Array.isArray(raw.matches)) {
        const matchIds = new Set()
        const duplicateMatches = raw.matches.filter(m => {
          if (!m.id || matchIds.has(m.id)) return true
          matchIds.add(m.id)
          return false
        })
        if (duplicateMatches.length > 0) {
          status.issues.push(`${duplicateMatches.length} משחקים כפולים`)
        }
      }
      
      return new Response(JSON.stringify({ ok: true, status }), { status: 200 })
    }
    
    if (action === 'cleanup') {
      // ניקוי וסדור הטבלאות
      const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.X_ADMIN_TOKEN
      const token = req.headers.get('x-admin-token')
      
      // אבטחה: דרוש טוקן אדמין לניקוי
      if (ADMIN_TOKEN && (!token || token !== ADMIN_TOKEN)) {
        return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 })
      }
    }
    
    if (action === 'clearAll') {
      // ניקוי מלא של כל הנתונים
      try {
        // מחק את הטבלה הראשית
        await kv.del(KEY)
        
        // מחק את הטבלאות המפוצלות
        await kv.del(META_KEY)
        await kv.del(USERS_KEY)
        
        // מחק טבלאות שבועות (1-10)
        for (let w = 1; w <= 10; w++) {
          await kv.del(MATCHES_KEY(w))
          await kv.del(GUESSES_KEY(w))
        }
        
        return new Response(JSON.stringify({ 
          ok: true, 
          message: 'כל הנתונים נמחקו בהצלחה'
        }), { status: 200 })
      } catch (err) {
        return new Response(JSON.stringify({ 
          ok: false, 
          error: 'Failed to clear data' 
        }), { status: 500 })
      }
    }
    
    if (action === 'cleanup') {
      // ניקוי וסדור הטבלאות
      const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.X_ADMIN_TOKEN
      const token = req.headers.get('x-admin-token')
      
      // אבטחה: דרוש טוקן אדמין לניקוי
      if (ADMIN_TOKEN && (!token || token !== ADMIN_TOKEN)) {
        return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 })
      }
      
      const raw = (await kv.get(KEY)) || defaultData
      let cleaned = 0
      
      // ניקוי משתמשים כפולים וחסרי ID
      if (Array.isArray(raw.users)) {
        const seen = new Set()
        const originalLength = raw.users.length
        raw.users = raw.users.filter(u => {
          if (!u.id || seen.has(u.id)) {
            cleaned++
            return false
          }
          seen.add(u.id)
          return true
        }).map(u => ({
          ...u,
          paymentStatus: u.paymentStatus || 'unpaid',
          createdAt: u.createdAt || new Date().toISOString(),
          updatedAt: u.updatedAt || new Date().toISOString()
        }))
        
        console.log(`Cleaned users: ${originalLength} → ${raw.users.length} (removed ${cleaned})`)
      }
      
      // ניקוי ניחושים כפולים וחסרי ID
      if (Array.isArray(raw.userGuesses)) {
        const seen = new Set()
        const originalLength = raw.userGuesses.length
        raw.userGuesses = raw.userGuesses.filter(g => {
          if (!g.id || seen.has(g.id)) {
            cleaned++
            return false
          }
          seen.add(g.id)
          return true
        }).map(g => ({
          ...g,
          paymentStatus: g.paymentStatus || 'unpaid',
          createdAt: g.createdAt || new Date().toISOString(),
          updatedAt: g.updatedAt || new Date().toISOString()
        }))
        
        console.log(`Cleaned guesses: ${originalLength} → ${raw.userGuesses.length} (removed ${cleaned})`)
      }
      
      // ניקוי משחקים כפולים וחסרי ID
      if (Array.isArray(raw.matches)) {
        const seen = new Set()
        const originalLength = raw.matches.length
        raw.matches = raw.matches.filter(m => {
          if (!m.id || seen.has(m.id)) {
            cleaned++
            return false
          }
          seen.add(m.id)
          return true
        }).map(m => ({
          ...m,
          week: Number(m.week) || 1,
          createdAt: m.createdAt || new Date().toISOString(),
          updatedAt: m.updatedAt || new Date().toISOString()
        }))
        
        console.log(`Cleaned matches: ${originalLength} → ${raw.matches.length} (removed ${cleaned})`)
      }
      
      // שמירה מחדש עם הטבלאות המפוצלות
      await kv.set(KEY, raw)
      
      // עדכון הטבלאות המפוצלות
      const metaToSave = {
        currentWeek: raw.currentWeek ?? defaultData.currentWeek,
        adminPassword: raw.adminPassword ?? defaultData.adminPassword,
        entryFee: raw.entryFee ?? defaultData.entryFee,
        totoFirstPrize: raw.totoFirstPrize ?? defaultData.totoFirstPrize,
        submissionsLocked: !!raw.submissionsLocked,
        countdownActive: !!raw.countdownActive,
        countdownTarget: raw.countdownTarget || ''
      }
      await kv.set(META_KEY, metaToSave)
      
      if (Array.isArray(raw.users)) {
        await kv.set(USERS_KEY, raw.users)
      }
      
      // עדכון טבלאות לפי שבוע
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
      
      const matchesByWeek = groupByWeek(raw.matches)
      for (const [w, list] of matchesByWeek.entries()) {
        await kv.set(MATCHES_KEY(w), list)
      }
      
      const guessesByWeek = groupByWeek(raw.userGuesses)
      for (const [w, list] of guessesByWeek.entries()) {
        await kv.set(GUESSES_KEY(w), list)
      }
      
      return new Response(JSON.stringify({ 
        ok: true, 
        cleaned,
        message: `נוקו ${cleaned} רשומות כפולות או חסרות`
      }), { status: 200 })
    }
    
    // Redis test (original functionality)
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
    // תמיד שבוע 1
    const fieldsParam = searchParams.get('fields') || searchParams.get('only')
    const wanted = fieldsParam ? new Set(fieldsParam.split(',').map(s => s.trim())) : null

    let data = raw
    // Shallow clone before mutating
    if (wanted) {
      data = { ...raw }
    }

    // תמיד שבוע 1
    const w = 1
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
