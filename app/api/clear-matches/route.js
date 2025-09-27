import { NextResponse } from 'next/server';
import { dataManager } from '../../../src/lib/data-manager';

export async function DELETE(request) {
  try {
    console.log('🗑️ API: Clear all matches request received');

    await dataManager.initialize();
    console.log('🗑️ API: Clearing all matches...');
    await dataManager.clearAllMatches();
    console.log(`✅ API: All matches cleared successfully`);

    return NextResponse.json({
      success: true,
      message: 'All matches cleared successfully'
    });

  } catch (error) {
    console.error('❌ API: Error clearing matches:', error);
    return NextResponse.json({
      error: 'Failed to clear matches',
      details: error.message
    }, { status: 500 });
  }
}
