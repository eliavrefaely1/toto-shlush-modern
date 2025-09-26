import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

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
const createFullBackup = async () => {
  try {
    const timestamp = new Date().toISOString()
    const backupId = timestamp.replace(/[:.]/g, '-')

    // קבלת כל הנתונים
    const [mainData, metaData, usersData] = await Promise.all([
      kv.get(KEY).catch(() => null),
      kv.get(META_KEY).catch(() => null),
      kv.get(USERS_KEY).catch(() => null)
    ])

    // קבלת נתונים לפי שבועות (רק שבוע 1 עכשיו)
    const weekData = {}
    const [matches, guesses] = await Promise.all([
      kv.get(MATCHES_KEY(1)).catch(() => null),
      kv.get(GUESSES_KEY(1)).catch(() => null)
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
      created: new Date().toISOString()
    }

    // שמירת הגיבוי
    await kv.set(BACKUP_KEY(backupId), backupData)

    // עדכון רשימת הגיבויים
    const backupList = await kv.get(BACKUP_LIST_KEY) || []
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
    await kv.set(BACKUP_LIST_KEY, trimmedList)

    // שליחת מייל אוטומטית (אם מוגדר)
    const adminEmail = process.env.ADMIN_EMAIL || metaData?.adminEmail
    if (adminEmail) {
      try {
        const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001'
        const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            backupData: {
              ...backupData,
              files: newBackupInfo.files
            },
            recipientEmail: adminEmail
          })
        })
        
        if (emailResponse.ok) {
          console.log('Backup email sent successfully to:', adminEmail)
        } else {
          console.error('Failed to send backup email:', await emailResponse.text())
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
      }
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
    // טעינת נתוני הגיבוי
    const backupData = await kv.get(BACKUP_KEY(backupId))
    if (!backupData) {
      return {
        success: false,
        error: 'Backup not found'
      }
    }

    const { mainData, metaData, usersData, weekData } = backupData

    // שחזור נתונים ראשיים
    if (mainData) {
      await kv.set(KEY, mainData)
    }

    // שחזור נתוני מטא
    if (metaData) {
      await kv.set(META_KEY, metaData)
    }

    // שחזור נתוני משתמשים
    if (usersData) {
      await kv.set(USERS_KEY, usersData)
    }

    // שחזור נתונים לפי שבועות
    if (weekData) {
      for (const [week, data] of Object.entries(weekData)) {
        const weekNum = parseInt(week)
        if (data.matches) {
          await kv.set(MATCHES_KEY(weekNum), data.matches)
        }
        if (data.guesses) {
          await kv.set(GUESSES_KEY(weekNum), data.guesses)
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
    const backupList = await kv.get(BACKUP_LIST_KEY) || []
    
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
    // מחיקת הגיבוי מ-KV
    await kv.del(BACKUP_KEY(backupId))
    
    // עדכון רשימת הגיבויים
    const backupList = await kv.get(BACKUP_LIST_KEY) || []
    const updatedList = backupList.filter(backup => backup.id !== backupId)
    await kv.set(BACKUP_LIST_KEY, updatedList)

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
        const result = await createFullBackup()
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

    // אבטחה: דרוש טוקן אדמין לפעולות רגישות
    if (ADMIN_TOKEN && (!token || token !== ADMIN_TOKEN)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

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
        if (!backupId) {
          return NextResponse.json({
            success: false,
            error: 'Backup ID is required for delete'
          }, { status: 400 })
        }
        
        const deleteResult = await deleteBackup(backupId)
        return NextResponse.json(deleteResult)
      
      case 'create':
        const createResult = await createFullBackup()
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
