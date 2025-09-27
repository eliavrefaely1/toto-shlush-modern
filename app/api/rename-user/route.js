import { NextResponse } from 'next/server';
import { dataManager } from '../../../src/lib/data-manager';

export async function PUT(request) {
  try {
    console.log('✏️ API: Rename user request received');
    const body = await request.json();
    console.log('📝 API: Request body:', body);
    const { oldName, newName } = body;

    if (!oldName || !newName) {
      console.log('❌ API: Missing required fields');
      return NextResponse.json({ error: 'Old name and new name are required' }, { status: 400 });
    }

    await dataManager.initialize();
    console.log(`✏️ API: Renaming user from "${oldName}" to "${newName}"...`);
    const updatedUser = await dataManager.renameUser(oldName, newName);
    console.log('✅ API: User renamed successfully:', updatedUser);

    return NextResponse.json({
      success: true,
      updatedUser: updatedUser
    });

  } catch (error) {
    console.error('❌ API: Error renaming user:', error);
    return NextResponse.json({
      error: 'Failed to rename user',
      details: error.message
    }, { status: 500 });
  }
}
