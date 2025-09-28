import { NextResponse } from 'next/server';

// Setup KV instance (Vercel KV or local mock)
let kvInstance = null;

const setupKV = async () => {
  if (kvInstance) return kvInstance;
  
  try {
    // Try to use Vercel KV if available
    const { kv } = await import('@vercel/kv');
    await kv.get('test'); // Test if KV is working
    kvInstance = kv;
    console.log('Using Vercel KV');
  } catch (error) {
    console.log('Vercel KV not available, using local mock');
    const { kv: localKV } = await import('../../lib/local-kv.js');
    kvInstance = localKV;
  }
  
  return kvInstance;
};

const KEY = 'toto:data:v1';
const META_KEY = 'toto:meta:v1';
const USERS_KEY = 'toto:users:v1';
const MATCHES_KEY = (w) => `toto:week:${w}:matches:v1`;
const GUESSES_KEY = (w) => `toto:week:${w}:guesses:v1`;

const defaultData = {
  adminPassword: '1234',
  entryFee: 35,
  totoFirstPrize: 8000000,
  matches: [],
  users: [],
  userGuesses: [],
  pots: [],
  deletedGuessKeys: [],
  deletedUsers: [],
  countdownActive: false,
  countdownTarget: ''
};

async function loadDataFromKV() {
  try {
    await setupKV();
    const raw = (await kvInstance.get(KEY)) || defaultData;
    const meta = await kvInstance.get(META_KEY).catch(()=>null);
    const users = await kvInstance.get(USERS_KEY).catch(()=>null);
    const matches = await kvInstance.get(MATCHES_KEY(1)).catch(()=>null);
    const guesses = await kvInstance.get(GUESSES_KEY(1)).catch(()=>null);

    return {
      users: Array.isArray(users) ? users : (Array.isArray(raw.users) ? raw.users : []),
      matches: Array.isArray(matches) ? matches : (Array.isArray(raw.matches) ? raw.matches : []),
      userGuesses: Array.isArray(guesses) ? guesses : (Array.isArray(raw.userGuesses) ? raw.userGuesses : []),
      settings: {
        adminPassword: meta?.adminPassword ?? raw.adminPassword,
        entryFee: meta?.entryFee ?? raw.entryFee,
        totoFirstPrize: meta?.totoFirstPrize ?? raw.totoFirstPrize,
        submissionsLocked: meta?.submissionsLocked ?? raw.submissionsLocked,
        countdownActive: meta?.countdownActive ?? raw.countdownActive,
        countdownTarget: meta?.countdownTarget ?? raw.countdownTarget,
        adminEmail: raw.adminEmail || ''
      }
    };
  } catch (error) {
    console.error('Error loading data from KV:', error);
    return defaultData;
  }
}

async function saveDataToKV(data) {
  try {
    await setupKV();
    
    // Save main data
    await kvInstance.set(KEY, data);
    
    // Save split tables
    const metaToSave = {
      adminPassword: data.settings?.adminPassword ?? defaultData.adminPassword,
      entryFee: data.settings?.entryFee ?? defaultData.entryFee,
      totoFirstPrize: data.settings?.totoFirstPrize ?? defaultData.totoFirstPrize,
      submissionsLocked: !!data.settings?.submissionsLocked,
      countdownActive: !!data.settings?.countdownActive,
      countdownTarget: data.settings?.countdownTarget || ''
    };
    await kvInstance.set(META_KEY, metaToSave);
    
    if (Array.isArray(data.users)) {
      await kvInstance.set(USERS_KEY, data.users);
    }
    
    if (Array.isArray(data.matches)) {
      await kvInstance.set(MATCHES_KEY(1), data.matches);
    }
    
    if (Array.isArray(data.userGuesses)) {
      await kvInstance.set(GUESSES_KEY(1), data.userGuesses);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving data to KV:', error);
    return false;
  }
}

async function renameUser(oldName, newName) {
  const data = await loadDataFromKV();
  
  // בדיקה שהשם החדש לא קיים
  const existingUser = data.users.find(u => 
    u.name.toLowerCase().trim() === newName.toLowerCase().trim()
  );
  if (existingUser) {
    throw new Error(`השם "${newName}" כבר קיים במערכת`);
  }
  
  // מצא את המשתמש הישן
  const user = data.users.find(u => 
    u.name.toLowerCase().trim() === oldName.toLowerCase().trim()
  );
  if (!user) {
    throw new Error(`המשתמש "${oldName}" לא נמצא`);
  }
  
  // עדכן את השם
  const oldNameValue = user.name;
  user.name = newName;
  user.updatedAt = new Date().toISOString();
  
  // עדכן את כל הניחושים
  data.userGuesses = (data.userGuesses || []).map(g => {
    if (g.name === oldNameValue) {
      return { ...g, name: newName, updatedAt: new Date().toISOString() };
    }
    return g;
  });
  
  // שמור בשרת
  await saveDataToKV(data);
  
  return user;
}

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

    console.log(`✏️ API: Renaming user from "${oldName}" to "${newName}"...`);
    const updatedUser = await renameUser(oldName, newName);
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
