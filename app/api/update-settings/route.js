import { NextResponse } from 'next/server';
import { dataManager } from '../../lib/data';

export async function PUT(request) {
  try {
    console.log('⚙️ API: Update settings request received');
    
    const body = await request.json();
    console.log('📝 API: Request body:', body);
    
    const { settings } = body;
    
    if (!settings) {
      console.log('❌ API: No settings provided');
      return NextResponse.json({ error: 'Settings are required' }, { status: 400 });
    }

    console.log(`⚙️ API: Updating settings...`);
    
    // זה ירוץ בצד השרת עם גישה ל-Vercel KV
    await dataManager.updateSettings(settings);
    
    console.log(`✅ API: Settings updated successfully`);
    
    return NextResponse.json({
      success: true,
      settings: settings
    });
    
  } catch (error) {
    console.error('❌ API: Error updating settings:', error);
    return NextResponse.json({ 
      error: 'Failed to update settings',
      details: error.message 
    }, { status: 500 });
  }
}
