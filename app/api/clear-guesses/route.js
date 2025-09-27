import { NextResponse } from 'next/server';
import { dataManager } from '../../../src/lib/data-manager';

export async function DELETE(request) {
  try {
    console.log('🗑️ API: Clear all guesses request received');

    await dataManager.initialize();
    console.log('🗑️ API: Clearing all guesses...');
    await dataManager.clearAllGuesses();
    console.log(`✅ API: All guesses cleared successfully`);

    console.log('🔄 API: Calculating scores...');
    await dataManager.calculateScores();
    console.log('✅ API: Scores calculated successfully');

    return NextResponse.json({
      success: true,
      message: 'All guesses cleared successfully'
    });

  } catch (error) {
    console.error('❌ API: Error clearing guesses:', error);
    return NextResponse.json({
      error: 'Failed to clear guesses',
      details: error.message
    }, { status: 500 });
  }
}
