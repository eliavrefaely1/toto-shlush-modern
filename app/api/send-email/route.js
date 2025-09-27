import { NextResponse } from 'next/server'

// Ensure fresh responses
export const dynamic = 'force-dynamic'
export const revalidate = 0

// פונקציה לשליחת מייל
const sendEmail = async (to, subject, htmlContent, textContent, attachment = null) => {
  try {
    // שימוש ב-Resend API (חינמי עד 3,000 מיילים בחודש)
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      RESEND_API_KEY: RESEND_API_KEY ? 'SET' : 'NOT SET',
      hasApiKey: !!RESEND_API_KEY
    })
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not found in environment variables')
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('RESEND')))
      return { 
        success: false, 
        error: 'Email service not configured. Please set RESEND_API_KEY environment variable.' 
      }
    }

    const emailData = {
      from: 'Toto Shlush <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: htmlContent,
      text: textContent
    }

    // הוספת קובץ מצורף אם קיים
    if (attachment) {
      emailData.attachments = [{
        filename: attachment.filename,
        content: attachment.content,
        type: attachment.type || 'application/json'
      }]
    }

    console.log('Sending email to Resend API:', {
      to,
      subject,
      from: emailData.from,
      hasAttachment: !!attachment
    })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    console.log('Resend API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Resend API error:', errorData)
      return { success: false, error: errorData.message || `HTTP ${response.status}: ${response.statusText}` }
    }

    const result = await response.json()
    console.log('Resend API success:', result)
    return { success: true, messageId: result.id }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error: error.message }
  }
}

// שליחת גיבוי למייל
export async function POST(request) {
  try {
    const { backupData, recipientEmail } = await request.json()
    
    if (!backupData) {
      return NextResponse.json({
        success: false,
        error: 'Backup data is required'
      }, { status: 400 })
    }

    if (!recipientEmail) {
      return NextResponse.json({
        success: false,
        error: 'Recipient email is required'
      }, { status: 400 })
    }

    // יצירת תוכן המייל
    const timestamp = new Date(backupData.timestamp || new Date().toISOString()).toLocaleString('he-IL')
    const triggerAction = backupData.triggerAction || 'פעולה לא ידועה'
    const subject = `גיבוי נתונים - טוטו שלוש - ${timestamp}`
    
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .backup-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
          .stat-label { font-size: 14px; color: #666; }
          .footer { margin-top: 20px; padding: 15px; background: #e5e7eb; border-radius: 6px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 גיבוי נתונים - טוטו שלוש</h1>
            <p>גיבוי אוטומטי של נתוני המשחק</p>
          </div>
          
          <div class="content">
            <div class="backup-info">
              <h3>פרטי הגיבוי:</h3>
              <p><strong>תאריך יצירה:</strong> ${timestamp}</p>
              <p><strong>מזהה גיבוי:</strong> ${backupData.backupId || 'N/A'}</p>
              <p><strong>גרסה:</strong> ${backupData.version || '2.0'}</p>
              <p><strong>פעולה שגרמה לגיבוי:</strong> <span style="color: #2563eb; font-weight: bold;">${triggerAction}</span></p>
            </div>

            <div class="stats">
              <div class="stat">
                <div class="stat-number">${backupData.files?.mainData ? '✓' : '✗'}</div>
                <div class="stat-label">נתונים ראשיים</div>
              </div>
              <div class="stat">
                <div class="stat-number">${backupData.files?.usersData ? '✓' : '✗'}</div>
                <div class="stat-label">נתוני משתמשים</div>
              </div>
              <div class="stat">
                <div class="stat-number">${backupData.files?.weeks || 0}</div>
                <div class="stat-label">שבועות</div>
              </div>
            </div>

            <div class="backup-info">
              <h3>תוכן הגיבוי:</h3>
              <ul>
                <li>נתונים ראשיים: ${backupData.mainData ? 'נשמר' : 'לא זמין'}</li>
                <li>הגדרות מערכת: ${backupData.metaData ? 'נשמר' : 'לא זמין'}</li>
                <li>נתוני משתמשים: ${backupData.usersData ? 'נשמר' : 'לא זמין'}</li>
                <li>נתוני משחקים: ${backupData.weekData ? 'נשמר' : 'לא זמין'}</li>
              </ul>
            </div>

            <div class="footer">
              <p><strong>הערות חשובות:</strong></p>
              <ul>
                <li>גיבוי זה נוצר אוטומטית על ידי מערכת הגיבויים</li>
                <li>הקובץ המצורף מכיל את כל נתוני המשחק בפורמט JSON</li>
                <li>שמור את הגיבוי במקום בטוח</li>
                <li>בדוק תקינות הנתונים לאחר שחזור</li>
              </ul>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
גיבוי נתונים - טוטו שלוש
${timestamp}

פרטי הגיבוי:
- תאריך: ${timestamp}
- מזהה: ${backupData.backupId || 'N/A'}
- גרסה: ${backupData.version || '2.0'}
- פעולה שגרמה לגיבוי: ${triggerAction}

תוכן הגיבוי:
- נתונים ראשיים: ${backupData.mainData ? 'נשמר' : 'לא זמין'}
- הגדרות מערכת: ${backupData.metaData ? 'נשמר' : 'לא זמין'}
- נתוני משתמשים: ${backupData.usersData ? 'נשמר' : 'לא זמין'}
- נתוני משחקים: ${backupData.weekData ? 'נשמר' : 'לא זמין'}

הערות:
- גיבוי זה נוצר אוטומטית
- הקובץ המצורף מכיל את כל הנתונים
- שמור במקום בטוח
    `

    // יצירת קובץ הגיבוי כקובץ מצורף
    const backupFile = {
      filename: `backup-${backupData.backupId || 'unknown'}.json`,
      content: Buffer.from(JSON.stringify(backupData, null, 2)).toString('base64'),
      type: 'application/json'
    }

    // שליחת המייל
    const result = await sendEmail(recipientEmail, subject, htmlContent, textContent, backupFile)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Backup sent successfully',
        messageId: result.messageId
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error sending backup email:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// שליחת הודעת טקסט פשוטה
export async function PUT(request) {
  try {
    const { to, subject, message } = await request.json()
    
    if (!to || !subject || !message) {
      return NextResponse.json({
        success: false,
        error: 'to, subject, and message are required'
      }, { status: 400 })
    }

    const result = await sendEmail(to, subject, message, message)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
