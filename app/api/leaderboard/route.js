import { dataManager } from '../../../src/lib/data-manager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request) {
  try {
    console.log('🔄 API: Loading leaderboard...');
    // השתמש ב-DataManager החדש במקום KV הישן
    const leaderboard = await dataManager.getLeaderboard();
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

