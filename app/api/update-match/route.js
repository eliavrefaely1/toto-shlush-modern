import { NextResponse } from 'next/server';
import { dataManager } from '../../lib/data';
import { broadcastMessage, WEBSOCKET_EVENTS } from '../../../src/lib/websocket-server';
import { logAdminAction } from '../../lib/event-logger';

export async function PUT(request) {
  try {
    console.log('⚽ API: Update match request received');
    const body = await request.json();
    console.log('📝 API: Request body:', body);
    const { matchId, field, value } = body;

    if (!matchId || !field) {
      console.log('❌ API: Missing required fields');
      return NextResponse.json({ error: 'Match ID and field are required' }, { status: 400 });
    }

    await dataManager.initialize();
    console.log('💾 API: Updating match...');
    
    // Get the match before update for logging
    const matches = await dataManager.getMatches();
    const beforeMatch = matches.find(m => m.id === matchId);
    
    const updatedMatch = await dataManager.updateMatch(matchId, { [field]: value });
    console.log('✅ API: Match updated successfully:', updatedMatch);

    // Log the event
    logAdminAction('update', 'match', matchId, beforeMatch, updatedMatch, {
      field,
      value,
      homeTeam: updatedMatch?.homeTeam || 'Unknown',
      awayTeam: updatedMatch?.awayTeam || 'Unknown'
    });

    if (field === 'result') {
      console.log('🔄 API: Calculating scores after result update...');
      // מצא את האינדקס של המשחק שהשתנה (מהנתונים שכבר טענו)
      const matches = await dataManager.getMatches();
      const matchIndex = matches.findIndex(m => m.id === matchId);
      if (matchIndex !== -1) {
        await dataManager.calculateScores(matchIndex);
      } else {
        await dataManager.calculateScores(); // fallback לחישוב מלא
      }
      console.log('✅ API: Scores calculated successfully');
    }

    // Broadcast real-time updates
    try {
      broadcastMessage(WEBSOCKET_EVENTS.MATCH_UPDATED, {
        match: updatedMatch
      });

      if (field === 'result') {
        // שליחת עדכון leaderboard ללא טעינה מיותרת
        broadcastMessage(WEBSOCKET_EVENTS.LEADERBOARD_UPDATED, {
          message: 'Leaderboard updated after match result change'
        });
        
        broadcastMessage(WEBSOCKET_EVENTS.SCORE_CALCULATED, {
          matchId: matchId,
          result: value
        });
      }
    } catch (broadcastError) {
      console.warn('Failed to broadcast updates:', broadcastError);
    }

    return NextResponse.json({
      success: true,
      updatedMatch: updatedMatch
    });

  } catch (error) {
    console.error('❌ API: Error updating match:', error);
    return NextResponse.json({
      error: 'Failed to update match',
      details: error.message
    }, { status: 500 });
  }
}
