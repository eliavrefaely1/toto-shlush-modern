import { dataManager } from '../../../src/lib/data-manager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request) {
  try {
    // השתמש ב-DataManager החדש במקום KV הישן
    const leaderboard = await dataManager.getLeaderboard();
    
    return Response.json({ 
      count: leaderboard.length, 
      leaderboard 
    }, { 
      headers: { 'Cache-Control': 'no-store' } 
    })
  } catch (err) {
    console.error('Error loading leaderboard:', err);
    return Response.json({ 
      leaderboard: [], 
      error: err.message 
    }, { 
      headers: { 'Cache-Control': 'no-store' } 
    })
  }
}

