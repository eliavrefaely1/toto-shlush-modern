import { kv } from '@vercel/kv'

// Ensure fresh responses and run on Edge for low latency
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Redis
const redis = Redis.fromEnv();


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
  // Fetch data from Redis
  const result = await redis.get("item");
  
  // Return the result in the response
  return new NextResponse(JSON.stringify({ result }), { status: 200 });
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    if (searchParams.get('diag') === '1') {
      // החזר סטטוס משתני סביבה כדי לאבחן
      return Response.json({
        ok: true,
        runtime,
        env: {
          KV_URL: !!process.env.KV_URL,
          KV_REST_API_URL: !!process.env.KV_REST_API_URL,
          KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
          KV_REST_API_READ_ONLY_TOKEN: !!process.env.KV_REST_API_READ_ONLY_TOKEN,
        }
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
    const data = await req.json()
    await kv.set(KEY, data)
    return Response.json({ ok: true }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'KV not available' }), { status: 503 })
  }
}
