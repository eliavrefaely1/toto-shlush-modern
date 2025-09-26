import { kv } from '@vercel/kv'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const KEY = 'toto:data:v1'
const META_KEY = 'toto:meta:v1'
const GUESSES_KEY = (w) => `toto:week:${w}:guesses:v1`

export async function GET(request) {
  try {
    const [meta, wkGuesses, raw] = await Promise.all([
      kv.get(META_KEY).catch(()=>null),
      kv.get(GUESSES_KEY(1)).catch(()=>null),
      kv.get(KEY).catch(()=>null)
    ])
    const entryFee = Number(meta?.entryFee ?? raw?.entryFee ?? 35)
    const guesses = Array.isArray(wkGuesses) ? wkGuesses : (Array.isArray(raw?.userGuesses) ? raw.userGuesses : [])
    const numOfPlayers = guesses.length
    const totalAmount = numOfPlayers * entryFee
    return Response.json({ numOfPlayers, amountPerPlayer: entryFee, totalAmount }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return Response.json({ numOfPlayers: 0, amountPerPlayer: 0, totalAmount: 0 }, { headers: { 'Cache-Control': 'no-store' } })
  }
}

