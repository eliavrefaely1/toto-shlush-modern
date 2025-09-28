import { NextResponse } from 'next/server';
import { dataManager } from '../../lib/data';

export async function PUT(request) {
  try {
    console.log('✏️ API: Update guess request received');
    const body = await request.json();
    console.log('📝 API: Request body:', body);
    const { guessId, guesses, updatedAt } = body;

    if (!guessId || !guesses) {
      console.log('❌ API: Missing required fields');
      return NextResponse.json({ error: 'Guess ID and guesses are required' }, { status: 400 });
    }

    await dataManager.initialize();
    console.log(`✏️ API: Updating guess ${guessId}...`);
    const updatedGuess = await dataManager.updateUserGuess(guessId, {
      guesses: guesses,
      updatedAt: updatedAt || new Date().toISOString()
    });
    console.log('✅ API: Guess updated successfully:', updatedGuess);

    console.log('🔄 API: Calculating scores...');
    await dataManager.calculateScores();
    console.log('✅ API: Scores calculated successfully');

    return NextResponse.json({
      success: true,
      updatedGuess: updatedGuess
    });

  } catch (error) {
    console.error('❌ API: Error updating guess:', error);
    return NextResponse.json({
      error: 'Failed to update guess',
      details: error.message
    }, { status: 500 });
  }
}
