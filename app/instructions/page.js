'use client'

import Link from 'next/link'
import { Trophy, Target, Clock, Star, Gift, RefreshCw } from 'lucide-react'

export default function InstructionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir="rtl">
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Trophy className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-blue-800">איך משחקים בטוטו שלוש</h1>
            </div>
            <p className="text-gray-600">מדריך פשוט וברור למשחק</p>
          </div>

          <div className="space-y-6">
            {/* Quick Summary */}
            <section className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold text-blue-800">תקציר מהיר</h2>
              </div>
              <div className="card-content text-gray-700 leading-7">
                <ul className="list-disc pr-5 space-y-2">
                  <li>בכל שבוע מועלים 16 משחקים חדשים לניחוש.</li>
                  <li>לכל משחק בוחרים אחת משלוש אפשרויות: 
                    <br></br>1 (ניצחון בית) 
                    <br></br>X (תיקו) 
                    <br></br>2 (ניצחון חוץ)</li>
                  <li>הניקוד הוא נקודה אחת לכל ניחוש נכון. הזוכה הוא בעל מירב הנקודות (שוויון – הקופה מתחלקת).</li>
                  <li>המערכת מתעדכנת בזמן אמת - כל המכשירים רואים את אותם נתונים.</li>
                </ul>
              </div>
            </section>

            {/* How to Play */}
            <section className="card">
              <div className="card-header flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-blue-800">איך משתתפים?</h2>
              </div>
              <div className="card-content text-gray-700 leading-7">
                <ol className="list-decimal pr-5 space-y-2">
                  <li>נכנסים ל‑<Link href="/guess" className="text-blue-600 underline">מלא טופס</Link>.</li>
                  <li>ממלאים שם מלא (כפי שתרצו שיופיע בטבלה).</li>
                  <li>בוחרים 1/X/2 לכל אחד מהמשחקים.</li>
                  <li>לוחצים שלח — תקבלו אישור והניחוש נשמר.</li>
                </ol>
              </div>
            </section>

            {/* Timing */}
            <section className="card">
              <div className="card-header flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-blue-800">דדליין ושעון רץ</h2>
              </div>
              <div className="card-content text-gray-700 leading-7">
                <ul className="list-disc pr-5 space-y-2">
                  <li>כאשר מופיע שעון רץ בעמוד הבית – זהו הדדליין להגשה. בהגעה ליעד ההגשה ננעלת אוטומטית.</li>
                  <li>אין שעון? ההגשה תינעל על‑ידי המנהל בזמן שיקבע. ממליצים להגיש בהקדם.</li>
                  <li>לאחר נעילה ניתן לצפות בטפסים ובטבלת הדירוג בלבד, ללא שינויי ניחושים.</li>
                </ul>
              </div>
            </section>

            {/* Scoring */}
            <section className="card">
              <div className="card-header flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-blue-800">איך מחושב הניקוד?</h2>
              </div>
              <div className="card-content text-gray-700 leading-7">
                <ul className="list-disc pr-5 space-y-2">
                  <li>כל ניחוש נכון מזכה בנקודה אחת.</li>
                  <li>אין בונוסים/מכפלות — פשוט וספורטיבי.</li>
                  <li>טבלת הדירוג לשבוע הנוכחי זמינה ב‑<Link href="/leaderboard" className="text-blue-600 underline">טבלת דירוג</Link>.</li>
                </ul>
              </div>
            </section>

            {/* Prizes */}
            <section className="card">
              <div className="card-header flex items-center gap-2">
                <Gift className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-blue-800">קופה ותשלום</h2>
              </div>
              <div className="card-content text-gray-700 leading-7">
                <ul className="list-disc pr-5 space-y-2">
                  <li>דמי השתתפות לשבוע: כפי שמופיע במסך ההגדרות.</li>
                  <li>הקופה = מספר המשתתפים × דמי השתתפות.</li>
                  <li>זכייה: הזוכה בעל מספר הנקודות הגבוה ביותר (במקרה שוויון — מתחלקים).</li>
                </ul>
              </div>
            </section>

            {/* System Features */}
            <section className="card">
              <div className="card-header flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-blue-800">טיפים וסנכרון</h2>
              </div>
              <div className="card-content text-gray-700 leading-7">
                <ul className="list-disc pr-5 space-y-2">
                  <li>אפשר לרענן נתונים בכל מסך בלחיצה על כפתור "רענן".</li>
                  <li>אם עברו כמה דקות – חזרו לעמוד הבית ולחצו "רענן" לקבלת עדכונים.</li>
                  <li>הנתונים מסתונכרנים לענן – כל המכשירים רואים אותו הדבר.</li>
                </ul>
              </div>
            </section>

            {/* Call to Action */}
            <section className="text-center">
              <Link href="/guess" className="btn btn-primary text-lg px-6 py-3">קדימה, למלא טופס! 🎯</Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
