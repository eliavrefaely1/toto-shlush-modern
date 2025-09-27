import { dataManager } from '../../../src/lib/data-manager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request) {
  try {
    // השתמש ב-DataManager החדש
    const pot = await dataManager.getPot();
    
    return Response.json(pot, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('Error loading pot:', err);
    return Response.json({ 
      numOfPlayers: 0, 
      amountPerPlayer: 0, 
      totalAmount: 0,
      error: err.message 
    }, { headers: { 'Cache-Control': 'no-store' } })
  }
}

