import { 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    getDoc, 
    updateDoc, 
    deleteDoc,
    query,
    where,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface Lesson {
    id?: string;
    courseId: string;
    title: string;
    date: Date;
    startTime: string;
    endTime: string;
    instructorId: string;
    instructorName?: string;
    description?: string;
    files?: Array<{ id: string; name: string; url: string; type: string }>;
    rating?: number;
    createdAt: Date;
}

export interface LessonData {
    courseId: string;
    title: string;
    date: Date;
    startTime: string;
    endTime: string;
    instructorId: string;
    instructorName?: string;
    description?: string;
    files?: Array<{ id: string; name: string; url: string; type: string }>;
    rating?: number;
}

// יצירת שיעור חדש
export const createLesson = async (data: LessonData): Promise<string> => {
    try {
        // מסנן את כל ה-undefined values כדי ש-Firestore לא יקבל שגיאה
        const cleanData: any = {
            courseId: data.courseId,
            title: data.title,
            date: Timestamp.fromDate(data.date),
            startTime: data.startTime,
            endTime: data.endTime,
            instructorId: data.instructorId,
            createdAt: Timestamp.now()
        };

        // מוסיף רק שדות שאינם undefined
        if (data.instructorName) cleanData.instructorName = data.instructorName;
        if (data.description) cleanData.description = data.description;
        if (data.files && data.files.length > 0) cleanData.files = data.files;
        if (data.rating !== undefined && data.rating !== null && data.rating > 0) {
            cleanData.rating = data.rating;
        }

        const docRef = await addDoc(collection(db, 'lessons'), cleanData);
        return docRef.id;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה ביצירת שיעור');
    }
};

// קבלת כל השיעורים של קורס מסוים
export const getLessonsByCourseId = async (courseId: string): Promise<Lesson[]> => {
    try {
        // משתמשים רק ב-where, ואז נמיין ב-client side כדי להימנע מ-index
        const q = query(
            collection(db, 'lessons'),
            where('courseId', '==', courseId)
        );
        const querySnapshot = await getDocs(q);
        const lessons = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Lesson));
        
        // מיון לפי תאריך ב-client side
        return lessons.sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת שיעורים');
    }
};

// קבלת שיעור לפי ID
export const getLessonById = async (lessonId: string): Promise<Lesson | null> => {
    try {
        const docRef = doc(db, 'lessons', lessonId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data(),
                date: docSnap.data().date?.toDate() || new Date(),
                createdAt: docSnap.data().createdAt?.toDate() || new Date()
            } as Lesson;
        }
        return null;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת שיעור');
    }
};

// עדכון שיעור
export const updateLesson = async (lessonId: string, data: Partial<LessonData & { presentationUrl?: string; worksheetUrl?: string; solutionsUrl?: string }>): Promise<void> => {
    try {
        const docRef = doc(db, 'lessons', lessonId);
        const updateData: any = {};
        
        // מוסיף רק שדות שאינם undefined
        if (data.title !== undefined) updateData.title = data.title;
        if (data.date) updateData.date = Timestamp.fromDate(data.date);
        if (data.startTime !== undefined) updateData.startTime = data.startTime;
        if (data.endTime !== undefined) updateData.endTime = data.endTime;
        if (data.instructorId !== undefined) updateData.instructorId = data.instructorId;
        if (data.instructorName !== undefined) updateData.instructorName = data.instructorName;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.files !== undefined) updateData.files = data.files;
        if (data.rating !== undefined && data.rating !== null) {
            if (data.rating > 0) {
                updateData.rating = data.rating;
            } else {
                // אם rating הוא 0 או null, מוחקים את השדה
                updateData.rating = null;
            }
        }
        
        await updateDoc(docRef, updateData);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בעדכון שיעור');
    }
};

// מחיקת שיעור
export const deleteLesson = async (lessonId: string): Promise<void> => {
    try {
        const docRef = doc(db, 'lessons', lessonId);
        await deleteDoc(docRef);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה במחיקת שיעור');
    }
};

