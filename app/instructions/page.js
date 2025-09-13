'use client'

import Link from 'next/link'
import { Info, Target, Star, Gift, Shield } from 'lucide-react'

export default function InstructionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Info className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-800">הוראות למשתתפים</h1>
        </div>
        <p className="text-gray-600">כל מה שצריך לדעת כדי להשתתף ולהנות</p>
      </div>

      <div className="space-y-6">
        <section className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-blue-800">מה זה טוטו שלוש?</h2>
          </div>
          <div className="card-content text-gray-700 leading-7">
            <p>
              משחק ניחושים שבועי על 16 משחקי כדורגל. לכל משחק בוחרים אחת משלוש אפשרויות: 1 (ניצחון בית), X (תיקו), 2 (ניצחון חוץ).
              בסוף השבוע מחשבים ניקוד לכל משתתף ולזוכה/ים מחולקת הקופה.
            </p>
          </div>
        </section>

        <section className="card">
          <div className="card-header flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-blue-800">איך משתתפים?</h2>
          </div>
          <div className="card-content text-gray-700 leading-7">
            <ol className="list-decimal pr-5 space-y-2">
              <li>נכנסים ל"<Link href="/guess" className="text-blue-600 underline">מלא טופס</Link>".</li>
              <li>ממלאים שם ומספר טלפון (לזיהוי הזוכה).</li>
              <li>בוחרים 1/X/2 לכל אחד מהמשחקים.</li>
              <li>לוחצים שלח — תקבלו אישור והניחוש נשמר.</li>
            </ol>
            <p className="text-sm text-gray-500 mt-3">אפשר לערוך ולשלוח שוב עד לסגירת ההשתתפות — השילוח האחרון הוא הקובע.</p>
          </div>
        </section>

        <section className="card">
          <div className="card-header flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-blue-800">איך מחושב הניקוד?</h2>
          </div>
          <div className="card-content text-gray-700 leading-7">
            <ul className="list-disc pr-5 space-y-2">
              <li>כל ניחוש נכון מזכה בנקודה אחת.</li>
              <li>אין בונוסים/מכפלות — פשוט וספורטיבי.</li>
              <li>טבלת הדירוג זמינה ב"<Link href="/leaderboard" className="text-blue-600 underline">טבלת דירוג</Link>".</li>
            </ul>
          </div>
        </section>

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

        <section className="card">
          <div className="card-header flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-blue-800">פרטיות וסנכרון</h2>
          </div>
          <div className="card-content text-gray-700 leading-7">
            <ul className="list-disc pr-5 space-y-2">
              <li>שומרים את הנתונים בענן בצורה מרוכזת — רואים את אותם נתונים בכל מכשיר.</li>
              <li>מספר הטלפון משמש לזיהוי ולדירוג — לא מועבר לצד שלישי.</li>
              <li>אפשר לרענן נתונים בכל מסך בלחיצה על כפתור “רענן”.</li>
            </ul>
          </div>
        </section>

        <section className="text-center">
          <Link href="/guess" className="btn btn-primary text-lg px-6 py-3">קדימה, למלא טופס! 🎯</Link>
        </section>
      </div>
    </div>
  )
}

