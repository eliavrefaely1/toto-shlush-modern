import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Ensure fresh responses
export const dynamic = 'force-dynamic'
export const revalidate = 0

// מפתחות הנתונים
const KEY = 'toto:data:v1'
const META_KEY = 'toto:meta:v1'
const USERS_KEY = 'toto:users:v1'
const MATCHES_KEY = (w) => `toto:week:${w}:matches:v1`
const GUESSES_KEY = (w) => `toto:week:${w}:guesses:v1`

// נתיב תיקיית הגיבויים
const BACKUP_DIR = path.join(process.cwd(), 'backups')

// וודא שתיקיית הגיבויים קיימת
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

// יצירת גיבוי מלא
const createFullBackup = async () => {
  try {
    ensureBackupDir()
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(BACKUP_DIR, `backup-${timestamp}`)
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // קבלת כל הנתונים
    const [mainData, metaData, usersData] = await Promise.all([
      kv.get(KEY).catch(() => null),
      kv.get(META_KEY).catch(() => null),
      kv.get(USERS_KEY).catch(() => null)
    ])

    // קבלת נתונים לפי שבועות (1-10)
    const weekData = {}
    for (let week = 1; week <= 10; week++) {
      const [matches, guesses] = await Promise.all([
        kv.get(MATCHES_KEY(week)).catch(() => null),
        kv.get(GUESSES_KEY(week)).catch(() => null)
      ])
      
      if (matches || guesses) {
        weekData[week] = { matches, guesses }
      }
    }

    // שמירת קבצי הגיבוי
    const backupData = {
      timestamp: new Date().toISOString(),
      mainData,
      metaData,
      usersData,
      weekData,
      version: '1.0'
    }

    const backupFile = path.join(backupDir, 'full-backup.json')
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))

    // יצירת קובץ README עם פרטי הגיבוי
    const readmeContent = `# גיבוי נתונים - ${timestamp}

## פרטי הגיבוי:
- תאריך: ${new Date().toLocaleString('he-IL')}
- גרסה: 1.0
- סוג: גיבוי מלא

## תוכן הגיבוי:
- נתונים ראשיים: ${mainData ? '✓' : '✗'}
- נתוני מטא: ${metaData ? '✓' : '✗'}
- נתוני משתמשים: ${usersData ? '✓' : '✗'}
- נתוני שבועות: ${Object.keys(weekData).length} שבועות

## איך לשחזר:
1. השתמש ב-API endpoint: POST /api/backup עם action: 'restore'
2. העלה את קובץ full-backup.json
3. הנתונים יוחזרו אוטומטית

## הערות:
- גיבוי זה נוצר אוטומטית על ידי מערכת הגיבויים
- שמור על קבצי הגיבוי במקום בטוח
- בדוק תקינות הנתונים לאחר שחזור
`

    fs.writeFileSync(path.join(backupDir, 'README.md'), readmeContent)

    return {
      success: true,
      backupPath: backupDir,
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
const restoreFromBackup = async (backupData) => {
  try {
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
const listBackups = () => {
  try {
    ensureBackupDir()
    
    const backups = fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('backup-'))
      .map(dirent => {
        const backupPath = path.join(BACKUP_DIR, dirent.name)
        const stats = fs.statSync(backupPath)
        const readmePath = path.join(backupPath, 'README.md')
        
        let info = {
          name: dirent.name,
          timestamp: dirent.name.replace('backup-', '').replace(/-/g, ':'),
          created: stats.birthtime,
          size: 0
        }

        // חישוב גודל התיקייה
        try {
          const files = fs.readdirSync(backupPath)
          info.size = files.reduce((total, file) => {
            const filePath = path.join(backupPath, file)
            const fileStats = fs.statSync(filePath)
            return total + fileStats.size
          }, 0)
        } catch (e) {
          // ignore
        }

        return info
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created))

    return {
      success: true,
      backups
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
const deleteBackup = (backupName) => {
  try {
    const backupPath = path.join(BACKUP_DIR, backupName)
    
    if (!fs.existsSync(backupPath)) {
      return {
        success: false,
        error: 'Backup not found'
      }
    }

    fs.rmSync(backupPath, { recursive: true, force: true })

    return {
      success: true,
      message: `Backup ${backupName} deleted successfully`
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
        return NextResponse.json(listBackups())
      
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
    const { action, backupName, backupData } = await request.json()
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
        if (!backupData) {
          return NextResponse.json({
            success: false,
            error: 'Backup data is required for restore'
          }, { status: 400 })
        }
        
        const restoreResult = await restoreFromBackup(backupData)
        return NextResponse.json(restoreResult)
      
      case 'delete':
        if (!backupName) {
          return NextResponse.json({
            success: false,
            error: 'Backup name is required for delete'
          }, { status: 400 })
        }
        
        const deleteResult = deleteBackup(backupName)
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
