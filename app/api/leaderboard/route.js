import { NextResponse } from 'next/server';

// Setup KV instance (Vercel KV or local mock)
let kvInstance = null;

const setupKV = async () => {
  if (kvInstance) return kvInstance;
  
  try {
    // Try to use Vercel KV if available
    const { kv } = await import('@vercel/kv');
    await kv.get('test'); // Test if KV is working
    kvInstance = kv;
    console.log('Using Vercel KV');
  } catch (error) {
    console.log('Vercel KV not available, using local mock');
    const { kv: localKV } = await import('../../lib/local-kv.js');
    kvInstance = localKV;
  }
  
  return kvInstance;
};

const KEY = 'toto:data:v1';
const META_KEY = 'toto:meta:v1';
const USERS_KEY = 'toto:users:v1';
const MATCHES_KEY = (w) => `toto:week:${w}:matches:v1`;
const GUESSES_KEY = (w) => `toto:week:${w}:guesses:v1`;

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
};

async function loadDataFromKV() {
  try {
    await setupKV();
    const raw = (await kvInstance.get(KEY)) || defaultData;
    const meta = await kvInstance.get(META_KEY).catch(()=>null);
    const users = await kvInstance.get(USERS_KEY).catch(()=>null);
    const matches = await kvInstance.get(MATCHES_KEY(1)).catch(()=>null);
    const guesses = await kvInstance.get(GUESSES_KEY(1)).catch(()=>null);

    return {
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
    };
  } catch (error) {
    console.error('Error loading data from KV:', error);
    return defaultData;
  }
}

function calculateScore(guesses, results) {
  let score = 0;
  const correct = [];
  
  for (let i = 0; i < guesses.length && i < results.length; i++) {
    if (guesses[i] === results[i]) {
      score++;
      correct.push(true);
    } else {
      correct.push(false);
    }
  }
  
  return { score, correct };
}

async function getLeaderboard() {
  const data = await loadDataFromKV();
  const matches = data.matches;
  const results = matches.map(m => m.result || '');
  const users = data.users;
  const userMap = new Map(users.map(u => [u.id, u]));

  const leaderboard = data.userGuesses
    .map(guess => {
      const user = userMap.get(guess.userId);
      const { score, correct } = calculateScore(guess.guesses, results);
      
      return {
        id: guess.id,
        userId: guess.userId,
        name: user?.name || guess.name,
        phone: user?.phone || guess.phone,
        score: score,
        paymentStatus: guess.paymentStatus,
        guesses: guess.guesses,
        user: user || { 
          id: guess.userId, 
          name: guess.name, 
          phone: guess.phone, 
          paymentStatus: guess.paymentStatus,
          isAdmin: false,
          createdAt: guess.createdAt,
          updatedAt: guess.updatedAt
        }
      };
    })
    .sort((a, b) => b.score - a.score);

  return leaderboard;
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request) {
  try {
    console.log('🔄 API: Loading leaderboard...');
    const leaderboard = await getLeaderboard();
    console.log(`✅ API: Loaded ${leaderboard.length} leaderboard entries`);
    
    return Response.json({ 
      count: leaderboard.length, 
      leaderboard 
    }, { 
      headers: { 'Cache-Control': 'no-store' } 
    })
  } catch (err) {
    console.error('❌ API: Error loading leaderboard:', err);
    return Response.json({ 
      leaderboard: [], 
      error: err.message 
    }, { 
      headers: { 'Cache-Control': 'no-store' } 
    })
  }
}

