import { NextResponse } from 'next/server';
import { dataManager } from '../../lib/data';

export async function DELETE(request) {
  try {
    console.log('🗑️ API: Delete user request received');
    
    const body = await request.json();
    console.log('📝 API: Request body:', body);
    
    const { userId } = body;
    
    if (!userId) {
      console.log('❌ API: No userId provided');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🗑️ API: Deleting user ${userId}...`);
    
    // זה ירוץ בצד השרת עם גישה ל-Vercel KV
    const result = await dataManager.deleteUser(userId);
    
    console.log(`✅ API: Delete result:`, result);
    
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
