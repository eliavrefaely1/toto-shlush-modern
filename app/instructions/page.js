'use client';

import Link from 'next/link';
import { Target, Star, Gift, Clock, RefreshCw, Users } from 'lucide-react';
import InstructionsHeader from '../components/InstructionsHeader';
import InstructionsSection from '../components/InstructionsSection';
import InstructionsActions from '../components/InstructionsActions';

export default function InstructionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl">
      <InstructionsHeader />

      <div className="space-y-6">
        <InstructionsSection title="תקציר מהיר">
          <ul className="list-disc pr-5 space-y-2">
            <li>בכל שבוע מועלים 16 משחקים חדשים לניחוש.</li>
            <li>לכל משחק בוחרים אחת משלוש אפשרויות: 
              <br></br>1 (ניצחון בית) 
              <br></br>X (תיקו) 
              <br></br>2 (ניצחון חוץ)</li>
            <li>הניקוד הוא נקודה אחת לכל ניחוש נכון. הזוכה הוא בעל מירב הנקודות (שוויון – הקופה מתחלקת).<br></br> במידה ויש כמה זוכים, הם מתחלקים שווה בשווה בפרס.</li>
            <li>המערכת שומרת היסטוריה – אפשר לעבור בין שבועות ולצפות בתוצאות עבר.</li>
          </ul>
        </InstructionsSection>

        <InstructionsSection icon={Target} title="איך משתתפים?">
          <ol className="list-decimal pr-5 space-y-2">
            <li>נכנסים ל‑<Link href="/guess" className="text-blue-600 underline">מלא טופס</Link>.</li>
            <li>ממלאים שם מלא (כפי שתרצו שיופיע בטבלה).</li>
            <li>בוחרים 1/X/2 לכל אחד מהמשחקים.</li>
            <li>לוחצים שלח — תקבלו אישור והניחוש נשמר.</li>
          </ol>
        </InstructionsSection>

        <InstructionsSection icon={Clock} title="דדליין ושעון רץ">
          <ul className="list-disc pr-5 space-y-2">
            <li>כאשר מופיע שעון רץ בעמוד הבית – זהו הדדליין להגשה. בהגעה ליעד ההגשה ננעלת אוטומטית.</li>
            <li>אין שעון? ההגשה תינעל על‑ידי המנהל בזמן שיקבע. ממליצים להגיש בהקדם.</li>
            <li>לאחר נעילה ניתן לצפות בטפסים ובטבלת הדירוג בלבד, ללא שינויי ניחושים.</li>
          </ul>
        </InstructionsSection>

        <InstructionsSection icon={Star} title="איך מחושב הניקוד?">
          <ul className="list-disc pr-5 space-y-2">
            <li>כל ניחוש נכון מזכה בנקודה אחת.</li>
            <li>אין בונוסים/מכפלות — פשוט וספורטיבי.</li>
            <li>טבלת הדירוג לשבוע הנוכחי זמינה ב‑<Link href="/leaderboard" className="text-blue-600 underline">טבלת דירוג</Link>.</li>
          </ul>
        </InstructionsSection>

        <InstructionsSection icon={Gift} title="קופה ותשלום">
          <ul className="list-disc pr-5 space-y-2">
            <li>דמי השתתפות לשבוע: כפי שמופיע במסך ההגדרות.</li>
            <li>הקופה = מספר המשתתפים × דמי השתתפות.</li>
            <li>זכייה: הזוכה בעל מספר הנקודות הגבוה ביותר (במקרה שוויון — מתחלקים).</li>
          </ul>
        </InstructionsSection>

        <InstructionsSection icon={Users} title="שבועות וארכיון">
          <ul className="list-disc pr-5 space-y-2">
            <li>כל שבוע עומד בפני עצמו: משחקים חדשים, טפסים חדשים, דירוג חדש.</li>
            <li>שבועות קודמים נשמרים — במסך הדירוג אפשר לעבור שבוע באמצעות הרשימה למעלה.</li>
          </ul>
        </InstructionsSection>

        <InstructionsSection icon={RefreshCw} title="טיפים וסנכרון">
          <ul className="list-disc pr-5 space-y-2">
            <li>אפשר לרענן נתונים בכל מסך בלחיצה על כפתור "רענן".</li>
            <li>אם עברו כמה דקות – חזרו לעמוד הבית ולחצו "רענן" לקבלת עדכונים.</li>
            <li>הנתונים מסתונכרנים לענן – כל המכשירים רואים אותו הדבר.</li>
          </ul>
        </InstructionsSection>

        <InstructionsActions />
      </div>
    </div>
  );
}
