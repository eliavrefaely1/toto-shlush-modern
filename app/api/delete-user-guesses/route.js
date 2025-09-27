import { NextResponse } from 'next/server';
import { dataManager } from '../../../src/lib/data-manager';

export async function DELETE(request) {
  try {
    console.log('🗑️ API: Delete user guesses request received');
    const body = await request.json();
    console.log('📝 API: Request body:', body);
    const { userIdOrName } = body;

    if (!userIdOrName) {
      console.log('❌ API: No userIdOrName provided');
      return NextResponse.json({ error: 'User ID or name is required' }, { status: 400 });
    }

    await dataManager.initialize();
    console.log(`🗑️ API: Deleting guesses for user: ${userIdOrName}...`);
    await dataManager.deleteUserGuessesByUser(userIdOrName);
    console.log(`✅ API: User guesses deleted successfully`);

    console.log('🔄 API: Calculating scores...');
    await dataManager.calculateScores();
    console.log('✅ API: Scores calculated successfully');

    return NextResponse.json({
      success: true,
      message: 'User guesses deleted successfully'
    });

  } catch (error) {
    console.error('❌ API: Error deleting user guesses:', error);
    return NextResponse.json({
      error: 'Failed to delete user guesses',
      details: error.message
    }, { status: 500 });
  }
}
