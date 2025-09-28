import { NextResponse } from 'next/server';
import { dataManager } from '../../lib/data';

export async function POST(request) {
  try {
    console.log('🔄 API: Restore backup request received');
    const backupData = await request.json();
    console.log('📝 API: Backup data received:', backupData.backupId);

    await dataManager.initialize();
    
    // Clear existing data
    console.log('🗑️ API: Clearing existing data...');
    await dataManager.clearAllMatches();
    
    // Restore matches
    if (backupData.mainData && backupData.mainData.matches) {
      console.log(`⚽ API: Restoring ${backupData.mainData.matches.length} matches...`);
      for (const match of backupData.mainData.matches) {
        await dataManager.addMatch(match);
      }
    }
    
    // Restore settings
    if (backupData.metaData) {
      console.log('⚙️ API: Restoring settings...');
      await dataManager.updateSettings(backupData.metaData);
    }
    
    // Restore users
    if (backupData.usersData) {
      console.log(`👥 API: Restoring ${backupData.usersData.length} users...`);
      for (const user of backupData.usersData) {
        await dataManager.addUser(user);
      }
    }
    
    // Restore guesses
    if (backupData.weekData && backupData.weekData['1'] && backupData.weekData['1'].guesses) {
      console.log(`🎯 API: Restoring ${backupData.weekData['1'].guesses.length} guesses...`);
      for (const guess of backupData.weekData['1'].guesses) {
        await dataManager.addUserGuess(guess);
      }
    }

    console.log('✅ API: Backup restored successfully');
    return NextResponse.json({
      success: true,
      message: `Backup ${backupData.backupId} restored successfully`,
      restored: {
        matches: backupData.mainData?.matches?.length || 0,
        users: backupData.usersData?.length || 0,
        guesses: backupData.weekData?.['1']?.guesses?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ API: Error restoring backup:', error);
    return NextResponse.json({
      error: 'Failed to restore backup',
      details: error.message
    }, { status: 500 });
  }
}
