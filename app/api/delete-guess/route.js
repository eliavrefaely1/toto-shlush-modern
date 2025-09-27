import { NextResponse } from 'next/server';
import { dataManager } from '../../../src/lib/data-manager';

export async function DELETE(request) {
  try {
    console.log('🗑️ API: Delete guess request received');
    const body = await request.json();
    console.log('📝 API: Request body:', body);
    const { guessId } = body;

    if (!guessId) {
      console.log('❌ API: No guessId provided');
      return NextResponse.json({ error: 'Guess ID is required' }, { status: 400 });
    }

    await dataManager.initialize();
    console.log(`🗑️ API: Deleting guess ${guessId}...`);
    await dataManager.deleteUserGuess(guessId);
    console.log(`✅ API: Guess deleted successfully`);

    console.log('🔄 API: Calculating scores...');
    await dataManager.calculateScores();
    console.log('✅ API: Scores calculated successfully');

    return NextResponse.json({
      success: true,
      message: 'Guess deleted successfully'
    });

  } catch (error) {
    console.error('❌ API: Error deleting guess:', error);
    return NextResponse.json({
      error: 'Failed to delete guess',
      details: error.message
    }, { status: 500 });
  }
}
