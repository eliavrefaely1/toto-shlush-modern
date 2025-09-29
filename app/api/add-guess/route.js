import { NextResponse } from 'next/server';
import { dataManager } from '../../lib/data';
import { broadcastMessage, WEBSOCKET_EVENTS } from '../../../src/lib/websocket-server';
import { logUserAction } from '../../lib/event-logger';

export async function POST(request) {
  try {
    console.log('🎯 API: Add guess request received');
    
    const body = await request.json();
    console.log('📝 API: Request body:', body);
    
    const { name, guesses } = body;
    
    if (!name || !guesses) {
      console.log('❌ API: Missing name or guesses');
      return NextResponse.json({ error: 'Name and guesses are required' }, { status: 400 });
    }

    console.log(`🎯 API: Adding guess for user: ${name}`);
    
    // בדיקת נעילה
    await dataManager.initialize();
    const settings = await dataManager.getSettings();
    if (settings.submissionsLocked) {
      console.log('🔒 API: Submissions are locked');
      return NextResponse.json({ error: 'Submissions are locked' }, { status: 403 });
    }

    // יצירת משתמש אם לא קיים
    let users = await dataManager.getUsers();
    let user = users.find(u => (u.name||'').toLowerCase().trim() === name.toLowerCase().trim());
    if (!user) {
      console.log(`👤 API: Creating new user: ${name}`);
      user = await dataManager.addUser({ name });
    }

    // שמירת הניחושים
    console.log(`💾 API: Adding guess for user ID: ${user.id}`);
    const result = await dataManager.addUserGuess({ 
      userId: user.id, 
      name: name, 
      guesses: guesses 
    });
    
    console.log(`✅ API: Guess added successfully for user: ${name}`);

    // Log the event
    logUserAction(name, 'create', 'guess', result.id, null, result, {
      userId: user.id,
      guessCount: guesses.filter(g => g && g.trim()).length,
      isNewUser: !users.find(u => (u.name||'').toLowerCase().trim() === name.toLowerCase().trim())
    });

    // Broadcast real-time updates
    try {
      broadcastMessage(WEBSOCKET_EVENTS.GUESS_SUBMITTED, {
        guess: result,
        user: user
      });

      // Update leaderboard and pot
      const leaderboard = await dataManager.getLeaderboard();
      const pot = await dataManager.getPot();
      
      broadcastMessage(WEBSOCKET_EVENTS.LEADERBOARD_UPDATED, {
        leaderboard
      });
      
      broadcastMessage(WEBSOCKET_EVENTS.POT_UPDATED, {
        pot
      });
    } catch (broadcastError) {
      console.warn('Failed to broadcast updates:', broadcastError);
    }

    return NextResponse.json({
      success: true,
      user: user,
      guess: result
    });
    
  } catch (error) {
    console.error('❌ API: Error adding guess:', error);
    return NextResponse.json({ 
      error: 'Failed to add guess',
      details: error.message 
    }, { status: 500 });
  }
}
