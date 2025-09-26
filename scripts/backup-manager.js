#!/usr/bin/env node

/**
 * סקריפט ניהול גיבויים לטוטו שלוש
 * 
 * שימוש:
 * node scripts/backup-manager.js create    - יצירת גיבוי חדש
 * node scripts/backup-manager.js list      - הצגת רשימת גיבויים
 * node scripts/backup-manager.js restore   - שחזור מגיבוי
 * node scripts/backup-manager.js delete    - מחיקת גיבוי
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

// נתיבים
const BACKUP_DIR = path.join(__dirname, '..', 'backups')
const SCRIPT_DIR = __dirname

// צבעים לקונסול
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// פונקציות עזר
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

const error = (message) => log(`❌ ${message}`, 'red')
const success = (message) => log(`✅ ${message}`, 'green')
const info = (message) => log(`ℹ️  ${message}`, 'blue')
const warning = (message) => log(`⚠️  ${message}`, 'yellow')

// וודא שתיקיית הגיבויים קיימת
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    info(`נוצרה תיקיית גיבויים: ${BACKUP_DIR}`)
  }
}

// יצירת גיבוי
const createBackup = async () => {
  try {
    ensureBackupDir()
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(BACKUP_DIR, `backup-${timestamp}`)
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    info('יוצר גיבוי...')
    
    // קריאה ל-API ליצירת גיבוי
    const response = await fetch('http://localhost:3000/api/backup?action=create')
    const result = await response.json()
    
    if (result.success) {
      success(`גיבוי נוצר בהצלחה: ${result.timestamp}`)
      info(`מיקום: ${result.backupPath}`)
      info(`קבצים: ${JSON.stringify(result.files, null, 2)}`)
    } else {
      error(`שגיאה ביצירת גיבוי: ${result.error}`)
    }
  } catch (err) {
    error(`שגיאה ביצירת גיבוי: ${err.message}`)
  }
}

// הצגת רשימת גיבויים
const listBackups = () => {
  try {
    ensureBackupDir()
    
    const backups = fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('backup-'))
      .map(dirent => {
        const backupPath = path.join(BACKUP_DIR, dirent.name)
        const stats = fs.statSync(backupPath)
        
        let size = 0
        try {
          const files = fs.readdirSync(backupPath)
          size = files.reduce((total, file) => {
            const filePath = path.join(backupPath, file)
            const fileStats = fs.statSync(filePath)
            return total + fileStats.size
          }, 0)
        } catch (e) {
          // ignore
        }

        return {
          name: dirent.name,
          timestamp: dirent.name.replace('backup-', '').replace(/-/g, ':'),
          created: stats.birthtime,
          size
        }
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created))

    if (backups.length === 0) {
      warning('אין גיבויים זמינים')
      return
    }

    log(`\n📋 רשימת גיבויים (${backups.length}):`, 'bright')
    log('=' * 60, 'cyan')
    
    backups.forEach((backup, index) => {
      const sizeStr = formatFileSize(backup.size)
      const dateStr = backup.created.toLocaleString('he-IL')
      
      log(`\n${index + 1}. ${backup.name}`, 'green')
      log(`   📅 נוצר: ${dateStr}`, 'blue')
      log(`   📦 גודל: ${sizeStr}`, 'blue')
      log(`   🕒 זמן: ${backup.timestamp}`, 'blue')
    })
    
    log('\n' + '=' * 60, 'cyan')
  } catch (err) {
    error(`שגיאה בטעינת רשימת גיבויים: ${err.message}`)
  }
}

// שחזור מגיבוי
const restoreBackup = async () => {
  try {
    const backups = fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('backup-'))
      .map(dirent => dirent.name)
      .sort()

    if (backups.length === 0) {
      warning('אין גיבויים זמינים לשחזור')
      return
    }

    log('\n📋 בחר גיבוי לשחזור:', 'bright')
    backups.forEach((backup, index) => {
      log(`${index + 1}. ${backup}`, 'green')
    })

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const question = (prompt) => {
      return new Promise((resolve) => {
        rl.question(prompt, resolve)
      })
    }

    const choice = await question('\nהזן מספר גיבוי (או "ביטול"): ')
    rl.close()

    if (choice.toLowerCase() === 'ביטול' || choice === '') {
      info('ביטול שחזור')
      return
    }

    const backupIndex = parseInt(choice) - 1
    if (backupIndex < 0 || backupIndex >= backups.length) {
      error('בחירה לא תקינה')
      return
    }

    const selectedBackup = backups[backupIndex]
    const backupPath = path.join(BACKUP_DIR, selectedBackup, 'full-backup.json')

    if (!fs.existsSync(backupPath)) {
      error(`קובץ גיבוי לא נמצא: ${backupPath}`)
      return
    }

    warning(`⚠️  אתה עומד לשחזר מגיבוי: ${selectedBackup}`)
    warning('פעולה זו תחליף את כל הנתונים הנוכחיים!')
    
    const confirm = await question('האם אתה בטוח? (כן/לא): ')
    if (confirm.toLowerCase() !== 'כן' && confirm.toLowerCase() !== 'yes') {
      info('ביטול שחזור')
      return
    }

    info('משחזר נתונים...')
    
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
    
    const response = await fetch('http://localhost:3000/api/backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': process.env.ADMIN_TOKEN || '1234'
      },
      body: JSON.stringify({
        action: 'restore',
        backupData: backupData
      })
    })

    const result = await response.json()
    
    if (result.success) {
      success('נתונים שוחזרו בהצלחה!')
      info(`שוחזרו: ${JSON.stringify(result.restored, null, 2)}`)
    } else {
      error(`שגיאה בשחזור: ${result.error}`)
    }
  } catch (err) {
    error(`שגיאה בשחזור: ${err.message}`)
  }
}

// מחיקת גיבוי
const deleteBackup = async () => {
  try {
    const backups = fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('backup-'))
      .map(dirent => dirent.name)
      .sort()

    if (backups.length === 0) {
      warning('אין גיבויים זמינים למחיקה')
      return
    }

    log('\n📋 בחר גיבוי למחיקה:', 'bright')
    backups.forEach((backup, index) => {
      log(`${index + 1}. ${backup}`, 'red')
    })

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const question = (prompt) => {
      return new Promise((resolve) => {
        rl.question(prompt, resolve)
      })
    }

    const choice = await question('\nהזן מספר גיבוי (או "ביטול"): ')
    rl.close()

    if (choice.toLowerCase() === 'ביטול' || choice === '') {
      info('ביטול מחיקה')
      return
    }

    const backupIndex = parseInt(choice) - 1
    if (backupIndex < 0 || backupIndex >= backups.length) {
      error('בחירה לא תקינה')
      return
    }

    const selectedBackup = backups[backupIndex]
    
    warning(`⚠️  אתה עומד למחוק גיבוי: ${selectedBackup}`)
    const confirm = await question('האם אתה בטוח? (כן/לא): ')
    if (confirm.toLowerCase() !== 'כן' && confirm.toLowerCase() !== 'yes') {
      info('ביטול מחיקה')
      return
    }

    const backupPath = path.join(BACKUP_DIR, selectedBackup)
    fs.rmSync(backupPath, { recursive: true, force: true })
    
    success(`גיבוי נמחק בהצלחה: ${selectedBackup}`)
  } catch (err) {
    error(`שגיאה במחיקת גיבוי: ${err.message}`)
  }
}

// פורמט גודל קובץ
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// הצגת עזרה
const showHelp = () => {
  log('\n🔧 מנהל גיבויים - טוטו שלוש', 'bright')
  log('=' * 40, 'cyan')
  log('\nשימוש:', 'yellow')
  log('  node scripts/backup-manager.js <פעולה>', 'blue')
  log('\nפעולות זמינות:', 'yellow')
  log('  create  - יצירת גיבוי חדש', 'green')
  log('  list    - הצגת רשימת גיבויים', 'green')
  log('  restore - שחזור מגיבוי קיים', 'green')
  log('  delete  - מחיקת גיבוי', 'green')
  log('  help    - הצגת עזרה זו', 'green')
  log('\nדוגמאות:', 'yellow')
  log('  node scripts/backup-manager.js create', 'blue')
  log('  node scripts/backup-manager.js list', 'blue')
  log('  node scripts/backup-manager.js restore', 'blue')
  log('\nהערות:', 'yellow')
  log('• ודא שהשרת רץ על localhost:3000', 'blue')
  log('• הגדר ADMIN_TOKEN משתנה סביבה אם נדרש', 'blue')
  log('• גיבויים נשמרים בתיקיית ./backups', 'blue')
  log('=' * 40, 'cyan')
}

// פונקציה ראשית
const main = async () => {
  const action = process.argv[2]

  switch (action) {
    case 'create':
      await createBackup()
      break
    case 'list':
      listBackups()
      break
    case 'restore':
      await restoreBackup()
      break
    case 'delete':
      await deleteBackup()
      break
    case 'help':
    case '--help':
    case '-h':
      showHelp()
      break
    default:
      error('פעולה לא מוכרת')
      showHelp()
      process.exit(1)
  }
}

// הרצה
if (require.main === module) {
  main().catch(err => {
    error(`שגיאה: ${err.message}`)
    process.exit(1)
  })
}

module.exports = {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup
}
