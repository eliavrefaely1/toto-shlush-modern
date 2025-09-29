import { NextResponse } from 'next/server'

// Rate limiting storage
const rateLimitMap = new Map()

const checkRateLimit = (ip, limit = 100, windowMs = 60000) => {
  const now = Date.now()
  const key = ip
  const current = rateLimitMap.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= limit) {
    return false
  }
  
  current.count++
  return true
}

// Setup KV instance (Vercel KV or local mock)
let kvInstance = null

const setupKV = async () => {
  if (kvInstance) return kvInstance
  
  try {
    // Try to use Vercel KV if available
    const { kv } = await import('@vercel/kv')
    await kv.get('test') // Test if KV is working
    kvInstance = kv
    console.log('Using Vercel KV')
  } catch (error) {
    console.log('Vercel KV not available, using local mock')
    const { kv: localKV } = await import('../../lib/local-kv.js')
    kvInstance = localKV
  }
  
  return kvInstance
}

// Ensure fresh responses
export const dynamic = 'force-dynamic'
export const revalidate = 0

const KEY = 'toto:data:v1'
// Split-keys (progressive enhancement; keeps backward compatibility)
const META_KEY = 'toto:meta:v1'
const USERS_KEY = 'toto:users:v1'
const MATCHES_KEY = (w) => `toto:week:${w}:matches:v1`
const GUESSES_KEY = (w) => `toto:week:${w}:guesses:v1`

const defaultData = {
  adminPassword: '1234',
  entryFee: 35,
  totoFirstPrize: 8000000,
  matches: [],
  users: [],
  userGuesses: [],
  pots: [],
  deletedGuessKeys: [],
  deletedUsers: [],
  countdownActive: false,
  countdownTarget: ''
}

export const POST = async (req) => {
  try {
    await setupKV()
    const { action } = await req.json()
    
    if (action === 'status') {
      // בדיקת סטטוס הטבלאות
      const raw = (await kvInstance.get(KEY)) || defaultData
      const meta = await kvInstance.get(META_KEY).catch(()=>null)
      const users = await kvInstance.get(USERS_KEY).catch(()=>null)
      
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
        await kvInstance.del(KEY)
        
        // מחק את הטבלאות המפוצלות
        await kvInstance.del(META_KEY)
        await kvInstance.del(USERS_KEY)
        
        // מחק טבלאות שבועות (1-10)
        for (let w = 1; w <= 10; w++) {
          await kvInstance.del(MATCHES_KEY(w))
          await kvInstance.del(GUESSES_KEY(w))
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
      
      const raw = (await kvInstance.get(KEY)) || defaultData
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
          createdAt: m.createdAt || new Date().toISOString(),
          updatedAt: m.updatedAt || new Date().toISOString()
        }))
        
        console.log(`Cleaned matches: ${originalLength} → ${raw.matches.length} (removed ${cleaned})`)
      }
      
      // שמירה מחדש עם הטבלאות המפוצלות
      await kvInstance.set(KEY, raw)
      
      // עדכון הטבלאות המפוצלות
      const metaToSave = {
        adminPassword: raw.adminPassword ?? defaultData.adminPassword,
        entryFee: raw.entryFee ?? defaultData.entryFee,
        totoFirstPrize: raw.totoFirstPrize ?? defaultData.totoFirstPrize,
        submissionsLocked: !!raw.submissionsLocked,
        countdownActive: !!raw.countdownActive,
        countdownTarget: raw.countdownTarget || ''
      }
      await kvInstance.set(META_KEY, metaToSave)
      
      if (Array.isArray(raw.users)) {
        await kvInstance.set(USERS_KEY, raw.users)
      }
      
      // עדכון טבלאות
      if (Array.isArray(raw.matches)) {
        await kvInstance.set(MATCHES_KEY(1), raw.matches)
      }
      
      if (Array.isArray(raw.userGuesses)) {
        await kvInstance.set(GUESSES_KEY(1), raw.userGuesses)
      }
      
      return new Response(JSON.stringify({ 
        ok: true, 
        cleaned,
        message: `נוקו ${cleaned} רשומות כפולות או חסרות`
      }), { status: 200 })
    }
    
    // Default response for unknown actions
    return new NextResponse(JSON.stringify({ ok: false, error: 'Unknown action' }), { status: 400 })
  } catch (e) {
    return new NextResponse(JSON.stringify({ ok: false, error: 'Redis error' }), { status: 500 })
  }
}

export async function GET(request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip, 100, 60000)) {
      return new Response(JSON.stringify({ ok: false, error: 'Rate limit exceeded' }), { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    
    // אם מבקשים נתונים ישנים, טען ישירות מה-KV
    if (searchParams.get('legacy') === 'true') {
      try {
        await setupKV()
        const raw = (await kvInstance.get(KEY)) || defaultData
        const meta = await kvInstance.get(META_KEY).catch(()=>null)
        const users = await kvInstance.get(USERS_KEY).catch(()=>null)
        const matches = await kvInstance.get(MATCHES_KEY(1)).catch(()=>null)
        const guesses = await kvInstance.get(GUESSES_KEY(1)).catch(()=>null)

        const data = {
          users: Array.isArray(users) ? users : (Array.isArray(raw.users) ? raw.users : []),
          matches: Array.isArray(matches) ? matches : (Array.isArray(raw.matches) ? raw.matches : []),
          userGuesses: Array.isArray(guesses) ? guesses : (Array.isArray(raw.userGuesses) ? raw.userGuesses : []),
          settings: {
            adminPassword: meta?.adminPassword ?? raw.adminPassword,
            entryFee: meta?.entryFee ?? raw.entryFee,
            totoFirstPrize: meta?.totoFirstPrize ?? raw.totoFirstPrize,
            submissionsLocked: meta?.submissionsLocked ?? raw.submissionsLocked,
            countdownActive: meta?.countdownActive ?? raw.countdownActive,
            countdownTarget: meta?.countdownTarget ?? raw.countdownTarget,
            adminEmail: raw.adminEmail || ''
          }
        }

        return Response.json(data, { headers: { 'Cache-Control': 'no-store' } })
      } catch (error) {
        console.error('Error loading legacy data:', error)
        return Response.json({ error: error.message }, { status: 500 })
      }
    }
    
    // טען נתונים ישירות מה-KV
    const fieldsParam = searchParams.get('fields') || searchParams.get('only');
    const wanted = fieldsParam ? new Set(fieldsParam.split(',').map(s => s.trim())) : null;
    
    await setupKV();
    const raw = (await kvInstance.get(KEY)) || defaultData;
    const meta = await kvInstance.get(META_KEY).catch(()=>null);
    const users = await kvInstance.get(USERS_KEY).catch(()=>null);
    const matches = await kvInstance.get(MATCHES_KEY(1)).catch(()=>null);
    const guesses = await kvInstance.get(GUESSES_KEY(1)).catch(()=>null);

    let data = {
      users: Array.isArray(users) ? users : (Array.isArray(raw.users) ? raw.users : []),
      matches: Array.isArray(matches) ? matches : (Array.isArray(raw.matches) ? raw.matches : []),
      userGuesses: Array.isArray(guesses) ? guesses : (Array.isArray(raw.userGuesses) ? raw.userGuesses : []),
      settings: {
        adminPassword: meta?.adminPassword ?? raw.adminPassword,
        entryFee: meta?.entryFee ?? raw.entryFee,
        totoFirstPrize: meta?.totoFirstPrize ?? raw.totoFirstPrize,
        submissionsLocked: meta?.submissionsLocked ?? raw.submissionsLocked,
        countdownActive: meta?.countdownActive ?? raw.countdownActive,
        countdownTarget: meta?.countdownTarget ?? raw.countdownTarget,
        adminEmail: raw.adminEmail || ''
      },
      entryFee: meta?.entryFee ?? raw.entryFee ?? 35
    };

    // Filter by requested fields
    if (wanted) {
      const filtered = {};
      for (const field of wanted) {
        if (field in data) {
          filtered[field] = data[field];
        }
      }
      data = filtered;
    }

    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Error in data GET:', error)
    return Response.json({ 
      error: error.message,
      users: [],
      matches: [],
      userGuesses: [],
      settings: defaultData
    }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  }
}

export async function PUT(req) {
  try {
    // Rate limiting for write operations (more restrictive)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip, 50, 60000)) {
      return new Response(JSON.stringify({ ok: false, error: 'Rate limit exceeded' }), { status: 429 })
    }

    await setupKV()
    const incoming = await req.json()
    const current = (await kvInstance.get(KEY)) || defaultData
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.X_ADMIN_TOKEN
    const action = (req.headers.get('x-action') || '').toLowerCase()
    const token = req.headers.get('x-admin-token')

    // אבטחה: אם הוגדר טוקן בצד שרת — דרוש אותו בפעולות אדמין
    if (ADMIN_TOKEN && action === 'admin') {
      if (!token || token !== ADMIN_TOKEN) {
        console.log(`Unauthorized admin access attempt from IP: ${ip}`)
        return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 })
      }
    }

    // Logging for sensitive operations
    if (action === 'admin' || action === 'cleanup' || action === 'clearAll') {
      console.log(`Admin operation: ${action} from IP: ${ip}, token: ${token ? 'provided' : 'missing'}`)
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
    await kvInstance.set(KEY, toSave)

    // Also persist split-keys for faster targeted reads
    const metaToSave = {
      adminPassword: toSave.adminPassword ?? defaultData.adminPassword,
      entryFee: toSave.entryFee ?? defaultData.entryFee,
      totoFirstPrize: toSave.totoFirstPrize ?? defaultData.totoFirstPrize,
      submissionsLocked: !!toSave.submissionsLocked,
      countdownActive: !!toSave.countdownActive,
      countdownTarget: toSave.countdownTarget || ''
    }
    try { await kvInstance.set(META_KEY, metaToSave) } catch (_) {}

    if (Array.isArray(toSave.users)) {
      try { await kvInstance.set(USERS_KEY, toSave.users) } catch (_) {}
    }

    if (Array.isArray(toSave.matches)) {
      try { await kvInstance.set(MATCHES_KEY(1), toSave.matches) } catch (_) {}
    }
    if (Array.isArray(toSave.userGuesses)) {
      try { await kvInstance.set(GUESSES_KEY(1), toSave.userGuesses) } catch (_) {}
    }
    return Response.json({ ok: true }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'KV not available' }), { status: 503 })
  }
}
