import { NextResponse } from 'next/server';
import { dataManager } from '../../../src/lib/data-manager';

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
    const updatedMatch = await dataManager.updateMatch(matchId, { [field]: value });
    console.log('✅ API: Match updated successfully:', updatedMatch);

    if (field === 'result') {
      console.log('🔄 API: Calculating scores after result update...');
      await dataManager.calculateScores();
      console.log('✅ API: Scores calculated successfully');
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
