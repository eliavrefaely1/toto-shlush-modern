import { NextResponse } from 'next/server';
import { dataManager } from '../../lib/data';
import { liveScoresService } from '../../lib/live-scores-service';
import { broadcastMessage, WEBSOCKET_EVENTS } from '../../../src/lib/websocket-server';

/**
 * API endpoint לעדכון משחקים בזמן אמת
 * GET /api/live-scores/update
 */
export async function GET(request) {
  try {
    console.log('⚽ Live Scores: Update request received');
    
    // בדיקת סטטיסטיקות שימוש
    const usageStats = liveScoresService.getUsageStats();
    console.log('📊 Live Scores: Usage stats:', usageStats);
    
    if (usageStats.remainingCalls <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Daily API limit exceeded',
        usageStats
      }, { status: 429 });
    }

    // קבלת משחקים קיימים
    await dataManager.initialize();
    const existingMatches = await dataManager.getMatches();
    
    if (existingMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No matches to update',
        updatedMatches: [],
        usageStats
      });
    }

    console.log(`🔄 Live Scores: Updating ${existingMatches.length} matches`);
    
    // עדכון משחקים עם נתונים חיים
    const updatedMatches = await liveScoresService.updateExistingMatches(existingMatches);
    
    // עדכון במסד הנתונים
    let updatedCount = 0;
    for (const updatedMatch of updatedMatches) {
      try {
        const result = await dataManager.updateMatch(updatedMatch.id, {
          liveStatus: updatedMatch.liveStatus,
          currentMinute: updatedMatch.currentMinute,
          homeScore: updatedMatch.homeScore,
          awayScore: updatedMatch.awayScore,
          result: updatedMatch.result,
          lastUpdated: updatedMatch.lastUpdated,
          apiMatchId: updatedMatch.apiMatchId,
          isLiveTrackingEnabled: updatedMatch.isLiveTrackingEnabled
        });
        
        if (result) {
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error updating match ${updatedMatch.id}:`, error);
      }
    }

    // חישוב ניקוד מחדש אם יש תוצאות חדשות
    const hasNewResults = updatedMatches.some(match => 
      match.result && match.liveStatus === 'finished'
    );
    
    if (hasNewResults) {
      console.log('🔄 Live Scores: Calculating scores after result updates...');
      await dataManager.calculateScores();
      
      // עדכון דירוג
      const leaderboard = await dataManager.getLeaderboard();
      
      // שליחת עדכונים דרך WebSocket
      try {
        broadcastMessage(WEBSOCKET_EVENTS.LEADERBOARD_UPDATED, {
          leaderboard
        });
        
        broadcastMessage(WEBSOCKET_EVENTS.SCORE_CALCULATED, {
          updatedMatches: updatedMatches.filter(m => m.result && m.liveStatus === 'finished')
        });
      } catch (broadcastError) {
        console.warn('Failed to broadcast updates:', broadcastError);
      }
    }

    // שליחת עדכון משחקים דרך WebSocket
    try {
      broadcastMessage(WEBSOCKET_EVENTS.MATCH_UPDATED, {
        matches: updatedMatches,
        updateType: 'live_scores'
      });
    } catch (broadcastError) {
      console.warn('Failed to broadcast match updates:', broadcastError);
    }

    console.log(`✅ Live Scores: Successfully updated ${updatedCount} matches`);

    return NextResponse.json({
      success: true,
      updatedMatches,
      updatedCount,
      usageStats: liveScoresService.getUsageStats(),
      message: `Updated ${updatedCount} matches with live data`
    });

  } catch (error) {
    console.error('❌ Live Scores: Error updating matches:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update matches',
      details: error.message,
      usageStats: liveScoresService.getUsageStats()
    }, { status: 500 });
  }
}

/**
 * API endpoint לקבלת סטטיסטיקות שימוש
 * GET /api/live-scores/stats
 */
export async function POST(request) {
  try {
    const usageStats = liveScoresService.getUsageStats();
    
    return NextResponse.json({
      success: true,
      usageStats
    });
  } catch (error) {
    console.error('❌ Live Scores: Error getting stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get usage stats',
      details: error.message
    }, { status: 500 });
  }
}
