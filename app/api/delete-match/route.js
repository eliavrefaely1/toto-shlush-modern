import { NextResponse } from 'next/server';
import { dataManager } from '../../../src/lib/data-manager';

export async function DELETE(request) {
  try {
    console.log('🗑️ API: Delete match request received');
    const body = await request.json();
    console.log('📝 API: Request body:', body);
    const { matchId } = body;

    if (!matchId) {
      console.log('❌ API: No matchId provided');
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    await dataManager.initialize();
    console.log(`🗑️ API: Deleting match ${matchId}...`);
    await dataManager.deleteMatch(matchId);
    console.log(`✅ API: Match deleted successfully`);

    return NextResponse.json({
      success: true,
      message: 'Match deleted successfully'
    });

  } catch (error) {
    console.error('❌ API: Error deleting match:', error);
    return NextResponse.json({
      error: 'Failed to delete match',
      details: error.message
    }, { status: 500 });
  }
}
