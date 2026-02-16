// SQL Word interface for the game
export interface SQLWord {
  id: number;
  simpleHebrew: string;
  pronunciation: string;
  englishTerm: string;
  role: string;
}

export const sqlWords: SQLWord[] = [
  { id: 1, role: 'שליפת עמודות', simpleHebrew: 'בחר', pronunciation: 'סֶלֶקְט', englishTerm: 'SELECT' },
  { id: 2, role: 'בחירת טבלה', simpleHebrew: 'מתוך', pronunciation: 'פְרוֹם', englishTerm: 'FROM' },
  { id: 3, role: 'סינון שורות', simpleHebrew: 'איפה ש', pronunciation: 'וֶור', englishTerm: 'WHERE' },
  { id: 4, role: 'כינוי זמני', simpleHebrew: 'בתור', pronunciation: 'אֶז', englishTerm: 'AS' },
  { id: 5, role: 'הסרת כפילויות', simpleHebrew: 'ייחודי', pronunciation: 'דִיסְטִינְקְט', englishTerm: 'DISTINCT' },
  { id: 6, role: 'מיון תוצאות', simpleHebrew: 'סדר לפי', pronunciation: 'אוֹרְדֶר בַּאיי', englishTerm: 'ORDER BY' },
  { id: 7, role: 'הגבלת שורות', simpleHebrew: 'הגבל', pronunciation: 'לִימִיט', englishTerm: 'LIMIT' },
  { id: 8, role: 'טווח ערכים', simpleHebrew: 'בין', pronunciation: 'בִּיטְווִין', englishTerm: 'BETWEEN' },
  { id: 9, role: 'בדיקת רשימה', simpleHebrew: 'בתוך', pronunciation: 'אִין', englishTerm: 'IN' },
  { id: 10, role: 'חיפוש תבנית', simpleHebrew: 'כמו', pronunciation: 'לַייק / אָיי-לַייק', englishTerm: 'LIKE / ILIKE' },
  { id: 11, role: 'חיבור טבלאות', simpleHebrew: 'חיבור', pronunciation: 'ג\'וֹיְן', englishTerm: 'JOIN' },
  { id: 12, role: 'התאמה מלאה', simpleHebrew: 'חיבור פנימי', pronunciation: 'אִינֶר ג\'וֹיְן', englishTerm: 'INNER JOIN' },
  { id: 13, role: 'הכל משמאל', simpleHebrew: 'חיבור שמאלי', pronunciation: 'לֶפְט ג\'וֹיְן', englishTerm: 'LEFT JOIN' },
  { id: 14, role: 'חיבור שאילתות', simpleHebrew: 'איחוד', pronunciation: 'יוּנִיוֹן', englishTerm: 'UNION (ALL)' },
  { id: 15, role: 'איחוד לחישוב', simpleHebrew: 'קבץ לפי', pronunciation: 'גְרוּפּ בַּאיי', englishTerm: 'GROUP BY' },
  { id: 16, role: 'סינון קבוצות', simpleHebrew: 'שיהיה לו', pronunciation: 'הֶבִינְג', englishTerm: 'HAVING' },
  { id: 17, role: 'ספירת שורות', simpleHebrew: 'ספירה', pronunciation: 'קַאוּנְט', englishTerm: 'COUNT' },
  { id: 18, role: 'חיבור ערכים', simpleHebrew: 'סכום', pronunciation: 'סַאם', englishTerm: 'SUM' },
  { id: 19, role: 'חישוב ממוצע', simpleHebrew: 'ממוצע', pronunciation: 'אָבְרֶג\'', englishTerm: 'AVG' },
  { id: 20, role: 'ערכי קיצון', simpleHebrew: 'הכי הרבה / מעט', pronunciation: 'מַקְס / מִין', englishTerm: 'MAX / MIN' },
  { id: 21, role: 'ביצוע חישוב', simpleHebrew: 'פונקציה', pronunciation: 'פַאנְקְשֶן', englishTerm: 'FUNCTION' },
  { id: 22, role: 'סוג פלט', simpleHebrew: 'מחזירה', pronunciation: 'רִי-טֶרְנְס', englishTerm: 'RETURNS' },
  { id: 23, role: 'הגדרת משתנה', simpleHebrew: 'הצהר', pronunciation: 'דִי-קְלֶייר', englishTerm: 'DECLARE' },
  { id: 24, role: 'גבולות קוד', simpleHebrew: 'התחלה / סוף', pronunciation: 'בִּיגִין / אֶנְד', englishTerm: 'BEGIN / END' },
  { id: 25, role: 'בדיקת תנאי', simpleHebrew: 'אם / אחרת אם', pronunciation: 'אִיף / אֶלס-אִיף', englishTerm: 'IF / ELSIF' },
  { id: 26, role: 'בחירת מקרה', simpleHebrew: 'במקרה ש', pronunciation: 'קֵייס / וֶון', englishTerm: 'CASE / WHEN' },
  { id: 27, role: 'חזרה על קוד', simpleHebrew: 'לולאה', pronunciation: 'לוּפּ / וַואיי-ל', englishTerm: 'LOOP / WHILE' },
  { id: 28, role: 'יציאה מלולאה', simpleHebrew: 'צא', pronunciation: 'אֶקְזִיט', englishTerm: 'EXIT' },
  { id: 29, role: 'החזרת טבלה', simpleHebrew: 'החזר שאילתה', pronunciation: 'רִי-טֶרְנְקְווֶרִי', englishTerm: 'RETURN QUERY' },
  { id: 30, role: 'טיפול בשגיאה', simpleHebrew: 'חריגה / שגיאה', pronunciation: 'אֶקְסֶפְּשֶן', englishTerm: 'EXCEPTION' },
  { id: 31, role: 'הודעת לוג', simpleHebrew: 'הדפס הודעה', pronunciation: 'רֵייז נוֹטִיס', englishTerm: 'RAISE NOTICE' },
  { id: 32, role: 'פעולה אוטומטית', simpleHebrew: 'הדק אוטומטי', pronunciation: 'טְרִיגֶר', englishTerm: 'TRIGGER' },
  { id: 33, role: 'לפני/אחרי שינוי', simpleHebrew: 'חדש / ישן', pronunciation: 'נְיוּ / אוֹלְד', englishTerm: 'NEW / OLD' },
  { id: 34, role: 'רצף פעולות', simpleHebrew: 'פרוצדורה', pronunciation: 'פְּרוֹסִיגֶ\'ר', englishTerm: 'PROCEDURE' },
  { id: 35, role: 'מעבר שורה-שורה', simpleHebrew: 'סמן', pronunciation: 'קֶרְסוֹר', englishTerm: 'CURSOR' },
  { id: 36, role: 'רשימת ערכים', simpleHebrew: 'מערך', pronunciation: 'אֶרֵיי', englishTerm: 'ARRAY' },
  { id: 37, role: 'סוג נתונים', simpleHebrew: 'סוג עמודה', pronunciation: 'פֶּרְסֶנְט טַייפּ', englishTerm: '%TYPE' },
  { id: 38, role: 'שורה שלמה', simpleHebrew: 'סוג שורה', pronunciation: 'פֶּרְסֶנְט רוֹאוּ-טַייפּ', englishTerm: '%ROWTYPE' },
  { id: 39, role: 'תיקיית קונים', simpleHebrew: 'לקוחות', pronunciation: 'קַסְטֶמֶרְס', englishTerm: 'Customers' },
  { id: 40, role: 'מקור סחורה', simpleHebrew: 'ספקים', pronunciation: 'סַפְּלַייֶרְס', englishTerm: 'Suppliers' },
  { id: 41, role: 'פריטי מחסן', simpleHebrew: 'מוצרים', pronunciation: 'פְּרוֹדַקְטְס', englishTerm: 'Products' },
  { id: 42, role: 'סיווג מוצר', simpleHebrew: 'קטגוריות', pronunciation: 'קָטֶגוֹרִיז', englishTerm: 'Categories' },
  { id: 43, role: 'היסטוריית מכירה', simpleHebrew: 'הזמנות', pronunciation: 'אוֹרְדֶרְס', englishTerm: 'Orders' },
  { id: 44, role: 'בקרה ושינויים', simpleHebrew: 'יומן מעקב', pronunciation: 'אוֹדיט לוֹג', englishTerm: 'Audit Log' },
  { id: 45, role: 'שווי המחסן', simpleHebrew: 'מלאי', pronunciation: 'אִינְבֶנְטוֹרִי', englishTerm: 'Inventory' },
];

// Helper function to get random words for the game
export function getRandomWords(count: number): SQLWord[] {
  const shuffled = [...sqlWords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Helper function to get all wrong options for a word
export function getWrongOptions(correctWord: SQLWord, count: number): string[] {
  const otherWords = sqlWords.filter(w => w.id !== correctWord.id);
  const shuffled = [...otherWords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(w => w.simpleHebrew);
}
