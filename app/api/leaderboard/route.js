import { kv } from '@vercel/kv'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const KEY = 'toto:data:v1'
const META_KEY = 'toto:meta:v1'
const USERS_KEY = 'toto:users:v1'
const MATCHES_KEY = (w) => `toto:week:${w}:matches:v1`
const GUESSES_KEY = (w) => `toto:week:${w}:guesses:v1`

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    let w = Number(searchParams.get('week'))
    if (!w || Number.isNaN(w)) {
      const meta = await kv.get(META_KEY).catch(()=>null)
      if (meta && meta.currentWeek) w = Number(meta.currentWeek)
    }
    if (!w || Number.isNaN(w)) {
      const raw = await kv.get(KEY).catch(()=>null)
      w = Number(raw?.currentWeek || 1)
    }

    const [users, wkMatches, wkGuesses, raw] = await Promise.all([
      kv.get(USERS_KEY).catch(()=>null),
      kv.get(MATCHES_KEY(w)).catch(()=>null),
      kv.get(GUESSES_KEY(w)).catch(()=>null),
      kv.get(KEY).catch(()=>null)
    ])

    const matches = Array.isArray(wkMatches) ? wkMatches : (Array.isArray(raw?.matches) ? raw.matches.filter(m => Number(m.week) === w) : [])
    const guesses = Array.isArray(wkGuesses) ? wkGuesses : (Array.isArray(raw?.userGuesses) ? raw.userGuesses.filter(g => Number(g.week) === w) : [])
    const usersArr = Array.isArray(users) ? users : (Array.isArray(raw?.users) ? raw.users : [])
    const byId = new Map(usersArr.map(u => [u.id, u]))
    
    // 🔍 לוגים לדיבוג
    console.log('🔍 [Leaderboard API] Debug info:')
    console.log('📊 Total users:', usersArr.length)
    console.log('📊 Users with "מוטי":', usersArr.filter(u => u.name?.includes('מוטי')))
    console.log('📊 Total guesses:', guesses.length)
    console.log('📊 Guesses with "מוטי":', guesses.filter(g => g.name?.includes('מוטי')))

    // Compute scores (ensure up-to-date with latest match results)
    const results = matches.map(m => m.result || '')
    const leaderboard = guesses.map(g => {
      let score = 0
      for (let i=0;i<results.length;i++) {
        if (results[i] && g.guesses?.[i] === results[i]) score++
      }
      const u = byId.get(g.userId)
      
      // 🔍 לוגים ספציפיים למוטי
      if (g.name?.includes('מוטי') || u?.name?.includes('מוטי')) {
        console.log('🔍 [Leaderboard API] מוטי debug:')
        console.log('  - Guess name:', g.name)
        console.log('  - Guess userId:', g.userId)
        console.log('  - User from DB:', u)
        console.log('  - Final name will be:', u?.name || g.name)
      }
      
      return {
        id: g.id,
        userId: g.userId,
        name: u?.name || g.name,
        phone: u?.phone || g.phone,
        paymentStatus: u?.paymentStatus || 'unpaid',
        score,
        user: u || { name: g.name, phone: g.phone, paymentStatus: 'unpaid' }
      }
    }).sort((a,b)=>b.score - a.score)

    return Response.json({ week: w, count: leaderboard.length, leaderboard }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return Response.json({ week: null, leaderboard: [] }, { headers: { 'Cache-Control': 'no-store' } })
  }
}

