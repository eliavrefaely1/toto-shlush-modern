'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Target, 
  Star, 
  Gift, 
  Clock, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Play,
  Trophy,
  Zap,
  BookOpen,
  Home,
  HelpCircle,
  Shield
} from 'lucide-react';

interface InstructionSection {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  content: React.ReactNode;
  isExpanded?: boolean;
}

const InstructionsPage: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quick-summary', 'how-to-play', 'deadline', 'scoring', 'prize', 'tips']));

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const sections: InstructionSection[] = [
    {
      id: 'quick-summary',
      icon: Zap,
      title: 'תקציר מהיר',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border-r-4 border-blue-500">
            <h3 className="font-semibold text-blue-800 mb-2">המטרה:</h3>
            <p className="text-blue-700">לנחש נכון את תוצאות 16 משחקי כדורגל ולזכות בפרס הגדול!</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">🎯 איך מנחשים?</h4>
              <ul className="text-green-700 space-y-1 text-sm">
                <li>• 1 = ניצחון בית</li>
                <li>• X = תיקו</li>
                <li>• 2 = ניצחון חוץ</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">🏆 איך זוכים?</h4>
              <ul className="text-yellow-700 space-y-1 text-sm">
                <li>• נקודה לכל ניחוש נכון</li>
                <li>• הזוכה = הכי הרבה נקודות</li>
                <li>• שוויון = חלוקת הפרס</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'how-to-play',
      icon: Play,
      title: 'איך משתתפים?',
      content: (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">היכנסו לטופס</h4>
                  <p className="text-gray-600 text-sm">לחצו על <Link href="/guess" className="text-blue-600 underline font-medium">"מלא טופס"</Link> בתפריט</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">מלאו פרטים</h4>
                  <p className="text-gray-600 text-sm">שם מלא (כפי שתרצו שיופיע בטבלה)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">בחרו ניחושים</h4>
                  <p className="text-gray-600 text-sm">1/X/2 לכל משחק</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">שלחו</h4>
                  <p className="text-gray-600 text-sm">תקבלו אישור והניחוש נשמר</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">💡 טיפים:</h4>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>• אפשר לשנות ניחושים עד הדדליין</li>
                <li>• בדקו את השעון הרץ בעמוד הבית</li>
                <li>• הגישו מוקדם כדי לא לפספס</li>
                <li>• אפשר לראות את הניחושים שלכם בדירוג</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'deadline',
      icon: Clock,
      title: 'דדליין ושעון רץ',
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border-r-4 border-red-500">
            <h3 className="font-semibold text-red-800 mb-2">⏰ שעון רץ מופיע?</h3>
            <p className="text-red-700">זהו הדדליין להגשה! כשהשעון מגיע לאפס, ההגשה ננעלת אוטומטית והמערכת תמנע הוספת ניחושים חדשים.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">🕐 אין שעון?</h4>
              <p className="text-yellow-700 text-sm">ההנעילה תיקבע על ידי המנהל. מומלץ להגיש בהקדם!</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">🔒 אחרי נעילה</h4>
              <p className="text-green-700 text-sm">ניתן לצפות בטפסים ובדירוג בלבד, ללא שינויי ניחושים.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'scoring',
      icon: Star,
      title: 'איך מחושב הניקוד?',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-4 text-center">מערכת ניקוד פשוטה וברורה</h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">✓</span>
                </div>
                <h4 className="font-semibold text-green-800 mb-1">ניחוש נכון</h4>
                <p className="text-green-600 text-sm">+1 נקודה</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">✗</span>
                </div>
                <h4 className="font-semibold text-red-800 mb-1">ניחוש שגוי</h4>
                <p className="text-red-600 text-sm">0 נקודות</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">-</span>
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">ללא תוצאה</h4>
                <p className="text-gray-600 text-sm">0 נקודות</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">📊 דירוג שבועי</h4>
            <p className="text-blue-700 text-sm">הטבלה מתעדכנת אוטומטית עם כל תוצאה חדשה. צפו בדירוג ב-<Link href="/leaderboard" className="text-blue-600 underline font-medium">טבלת דירוג</Link>.</p>
          </div>
        </div>
      )
    },
    {
      id: 'prize',
      icon: Gift,
      title: 'קופה ותשלום',
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-4 text-center">💰 מערכת הפרסים</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600">₪</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">דמי השתתפות</h4>
                    <p className="text-gray-600 text-sm">₪30 לניחוש</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600">×</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">חישוב הקופה</h4>
                    <p className="text-gray-600 text-sm">מספר משתתפים × דמי השתתפות</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border-2 border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">🏆 זכייה</h4>
                <ul className="text-yellow-700 space-y-1 text-sm">
                  <li>• הזוכה = הכי הרבה נקודות</li>
                  <li>• שוויון = חלוקת הפרס שווה בשווה</li>
                  <li>• הפרס מחולק מיד לאחר סיום השבוע</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'tips',
      icon: RefreshCw,
      title: 'טיפים וסנכרון',
      content: (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-4 text-center text-xl">💡 טיפים שימושיים</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="text-yellow-700 space-y-2 text-sm">
                <li>• בדקו את השעון הרץ בעמוד הבית</li>
                <li>• הגישו ניחושים מוקדם</li>
                <li>• עקבו אחר הדירוג בזמן אמת</li>
                <li>• השתמשו בכפתור "רענן" לעדכון נתונים</li>
              </ul>
              <ul className="text-yellow-700 space-y-2 text-sm">
                <li>• אפשר לשנות ניחושים עד הדדליין</li>
                <li>• בדקו את ההוראות מעת לעת</li>
                <li>• שמרו על קשר עם המנהל</li>
                <li>• הגישו ניחושים מוקדם כדי לא לפספס</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                הוראות משחק
              </h1>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              מדריך מקיף למשחק הטוטו השבועי - איך משתתפים, מנצחים וזוכים בפרס הגדול!
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
              <Home className="w-4 h-4" />
              בית
            </Link>
            <span>›</span>
            <span className="text-blue-600 font-medium">הוראות</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const IconComponent = section.icon;
            
            return (
              <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-6 pb-6">
                    <div className="border-t border-gray-100 pt-4">
                      {section.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">🚀 מוכנים להתחיל?</h3>
            <p className="text-gray-600 mb-4">עכשיו שאתם יודעים איך זה עובד, בואו נשתתף!</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="/guess" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Target className="w-5 h-5" />
                מלא טופס ניחושים
              </Link>
              <Link 
                href="/leaderboard" 
                className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-all border border-gray-200 hover:border-gray-300"
              >
                <Trophy className="w-5 h-5" />
                צפה בדירוג
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionsPage;