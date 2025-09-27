import { NextResponse } from 'next/server';
import { dataManager } from '../../../src/lib/data-manager';

export async function DELETE(request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🗑️ API: Deleting user ${userId}...`);
    
    // זה ירוץ בצד השרת עם גישה ל-Vercel KV
    const result = await dataManager.deleteUser(userId);
    
    console.log(`✅ API: Successfully deleted user ${userId}`);
    
    return NextResponse.json({
      success: true,
      usersRemoved: result.usersRemoved,
      guessesRemoved: result.guessesRemoved
    });
    
  } catch (error) {
    console.error('❌ API: Error deleting user:', error);
    return NextResponse.json({ 
      error: 'Failed to delete user',
      details: error.message 
    }, { status: 500 });
  }
}
