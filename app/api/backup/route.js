import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

// Fallback to local KV for development
let kvInstance = kv

// Test if Vercel KV is available and set up fallback
const setupKV = async () => {
  try {
    // Test if Vercel KV is available
    await kv.get('test')
    kvInstance = kv
  } catch (error) {
    console.log('Vercel KV not available, using local mock')
    const { kv: localKV } = await import('../../lib/local-kv.js')
    kvInstance = localKV
  }
}

// Ensure fresh responses
export const dynamic = 'force-dynamic'
export const revalidate = 0

// מפתחות הנתונים
const KEY = 'toto:data:v1'
const META_KEY = 'toto:meta:v1'
const USERS_KEY = 'toto:users:v1'
const MATCHES_KEY = (w) => `toto:week:${w}:matches:v1`
const GUESSES_KEY = (w) => `toto:week:${w}:guesses:v1`

// מפתחות גיבויים
const BACKUP_LIST_KEY = 'toto:backups:list'
const BACKUP_KEY = (timestamp) => `toto:backup:${timestamp}`

// יצירת גיבוי מלא
const createFullBackup = async (triggerAction = 'Manual backup') => {
  try {
    await setupKV()
    const timestamp = new Date().toISOString()
    const backupId = timestamp.replace(/[:.]/g, '-')

    // קבלת כל הנתונים
    const [mainData, metaData, usersData] = await Promise.all([
      kvInstance.get(KEY).catch(() => null),
      kvInstance.get(META_KEY).catch(() => null),
      kvInstance.get(USERS_KEY).catch(() => null)
    ])

    // קבלת נתונים לפי שבועות (רק שבוע 1 עכשיו)
    const weekData = {}
    const [matches, guesses] = await Promise.all([
      kvInstance.get(MATCHES_KEY(1)).catch(() => null),
      kvInstance.get(GUESSES_KEY(1)).catch(() => null)
    ])
    
    if (matches || guesses) {
      weekData[1] = { matches, guesses }
    }

    // שמירת הגיבוי ב-KV
    const backupData = {
      timestamp,
      backupId,
      mainData,
      metaData,
      usersData,
      weekData,
      version: '2.0',
      created: new Date().toISOString(),
      triggerAction: triggerAction
    }

    // שמירת הגיבוי
    await kvInstance.set(BACKUP_KEY(backupId), backupData)

    // עדכון רשימת הגיבויים
    const backupList = await kvInstance.get(BACKUP_LIST_KEY) || []
    const newBackupInfo = {
      id: backupId,
      timestamp,
      created: new Date().toISOString(),
      size: JSON.stringify(backupData).length,
      files: {
        mainData: !!mainData,
        metaData: !!metaData,
        usersData: !!usersData,
        weeks: Object.keys(weekData).length
      }
    }
    
    // הוסף לתחילת הרשימה
    backupList.unshift(newBackupInfo)
    
    // שמור רק 50 הגיבויים האחרונים
    const trimmedList = backupList.slice(0, 50)
    await kvInstance.set(BACKUP_LIST_KEY, trimmedList)

    // שליחת מייל אוטומטית (אם מוגדר)
    const adminEmail = process.env.ADMIN_EMAIL || metaData?.adminEmail
    console.log('Backup email check:', { 
      adminEmail, 
      hasAdminEmail: !!adminEmail,
      envAdminEmail: process.env.ADMIN_EMAIL,
      metaAdminEmail: metaData?.adminEmail 
    })
    
    if (adminEmail) {
      try {
        const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001'
        console.log('Sending backup email to:', adminEmail, 'via:', `${baseUrl}/api/send-email`)
        
        const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            backupData: backupData,
            recipientEmail: adminEmail
          })
        })
        
        if (emailResponse.ok) {
          const emailResult = await emailResponse.json()
          console.log('Backup email sent successfully to:', adminEmail, 'Result:', emailResult)
        } else {
          const errorText = await emailResponse.text()
          console.error('Failed to send backup email:', errorText)
        }
      } catch (emailError) {
        console.error('Error sending backup email:', emailError)
        // לא נכשל את הגיבוי בגלל שגיאת מייל
      }
    }

    return {
      success: true,
      backupId,
      timestamp,
      files: {
        mainData: !!mainData,
        metaData: !!metaData,
        usersData: !!usersData,
        weeks: Object.keys(weekData).length
      },
      // הוסף את הנתונים המלאים לתגובה
      fullBackupData: backupData
    }
  } catch (error) {
    console.error('Error creating backup:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// שחזור נתונים מגיבוי
const restoreFromBackup = async (backupId) => {
  try {
    await setupKV()
    // טעינת נתוני הגיבוי
    const backupData = await kvInstance.get(BACKUP_KEY(backupId))
    if (!backupData) {
      return {
        success: false,
        error: 'Backup not found'
      }
    }

    const { mainData, metaData, usersData, weekData } = backupData

    // שחזור נתונים ראשיים
    if (mainData) {
      await kvInstance.set(KEY, mainData)
    }

    // שחזור נתוני מטא
    if (metaData) {
      await kvInstance.set(META_KEY, metaData)
    }

    // שחזור נתוני משתמשים
    if (usersData) {
      await kvInstance.set(USERS_KEY, usersData)
    }

    // שחזור נתונים לפי שבועות
    if (weekData) {
      for (const [week, data] of Object.entries(weekData)) {
        const weekNum = parseInt(week)
        if (data.matches) {
          await kvInstance.set(MATCHES_KEY(weekNum), data.matches)
        }
        if (data.guesses) {
          await kvInstance.set(GUESSES_KEY(weekNum), data.guesses)
        }
      }
    }

    return {
      success: true,
      restored: {
        mainData: !!mainData,
        metaData: !!metaData,
        usersData: !!usersData,
        weeks: weekData ? Object.keys(weekData).length : 0
      }
    }
  } catch (error) {
    console.error('Error restoring backup:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// רשימת גיבויים קיימים
const listBackups = async () => {
  try {
    await setupKV()
    const backupList = await kvInstance.get(BACKUP_LIST_KEY) || []
    
    return {
      success: true,
      backups: backupList
    }
  } catch (error) {
    console.error('Error listing backups:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// מחיקת גיבוי ישן
const deleteBackup = async (backupId) => {
  try {
    await setupKV()
    // מחיקת הגיבוי מ-KV
    await kvInstance.del(BACKUP_KEY(backupId))
    
    // עדכון רשימת הגיבויים
    const backupList = await kvInstance.get(BACKUP_LIST_KEY) || []
    const updatedList = backupList.filter(backup => backup.id !== backupId)
    await kvInstance.set(BACKUP_LIST_KEY, updatedList)

    return {
      success: true,
      message: `Backup ${backupId} deleted successfully`
    }
  } catch (error) {
    console.error('Error deleting backup:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'list':
        const listResult = await listBackups()
        return NextResponse.json(listResult)
      
      case 'create':
        const result = await createFullBackup('Manual backup via GET request')
        return NextResponse.json(result)
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: list, create'
        }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { action, backupId } = await request.json()
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.X_ADMIN_TOKEN
    const token = request.headers.get('x-admin-token')

    switch (action) {
      case 'restore':
        if (!backupId) {
          return NextResponse.json({
            success: false,
            error: 'Backup ID is required for restore'
          }, { status: 400 })
        }
        
        const restoreResult = await restoreFromBackup(backupId)
        return NextResponse.json(restoreResult)
      
      case 'delete':
        // מחיקה דורשת טוקן אדמין (פעולה רגישה)
        if (ADMIN_TOKEN && (!token || token !== ADMIN_TOKEN)) {
          return NextResponse.json({ 
            success: false, 
            error: 'Unauthorized' 
          }, { status: 401 })
        }
        
        if (!backupId) {
          return NextResponse.json({
            success: false,
            error: 'Backup ID is required for delete'
          }, { status: 400 })
        }
        
        const deleteResult = await deleteBackup(backupId)
        return NextResponse.json(deleteResult)
      
      case 'create':
        const { triggerAction } = await request.json().catch(() => ({}))
        const createResult = await createFullBackup(triggerAction || 'Manual backup')
        return NextResponse.json(createResult)
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: restore, delete, create'
        }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
