import { NextResponse } from 'next/server';
import { dataManager } from '../../lib/data';
import { logAdminAction } from '../../lib/event-logger';

export async function POST(request) {
  try {
    console.log('➕ API: Add match request received');
    const body = await request.json();
    console.log('📝 API: Request body:', body);

    await dataManager.initialize();
    console.log('💾 API: Adding match...');
    const newMatch = await dataManager.addMatch(body);
    console.log('✅ API: Match added successfully:', newMatch.id);

    // Log the event
    logAdminAction('create', 'match', newMatch.id, null, newMatch, {
      homeTeam: newMatch.homeTeam,
      awayTeam: newMatch.awayTeam,
      category: newMatch.category
    });

    return NextResponse.json({
      success: true,
      match: newMatch
    });

  } catch (error) {
    console.error('❌ API: Error adding match:', error);
    return NextResponse.json({
      error: 'Failed to add match',
      details: error.message
    }, { status: 500 });
  }
}
