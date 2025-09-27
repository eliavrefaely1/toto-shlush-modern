import { NextResponse } from 'next/server';
import { dataManager } from '../../../src/lib/data-manager';

export async function POST(request) {
  try {
    console.log('🏗️ API: Create default matches request received');

    await dataManager.initialize();
    console.log('🏗️ API: Creating default matches...');
    const newMatches = await dataManager.createDefaultMatches();
    console.log(`✅ API: Created ${newMatches.length} default matches`);

    return NextResponse.json({
      success: true,
      matches: newMatches
    });

  } catch (error) {
    console.error('❌ API: Error creating default matches:', error);
    return NextResponse.json({
      error: 'Failed to create default matches',
      details: error.message
    }, { status: 500 });
  }
}
