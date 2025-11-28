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
    startTime?: string;
    endTime?: string;
    instructorId: string;
    instructorName?: string;
    taughtInLesson?: string;
    description?: string;
    files?: Array<{ id: string; name: string; url: string; type: string; uploadedBy?: string; uploadedByName?: string; note?: string }>;
    rating?: number;
    attendanceChecked?: boolean;
    createdAt: Date;
}

export interface LessonData {
    courseId: string;
    title: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    instructorId: string;
    instructorName?: string;
    taughtInLesson?: string;
    description?: string;
    files?: Array<{ id: string; name: string; url: string; type: string; uploadedBy?: string; uploadedByName?: string; note?: string }>;
    rating?: number;
    attendanceChecked?: boolean;
}

// יצירת שיעור חדש
export const createLesson = async (data: LessonData): Promise<string> => {
    try {
        // מסנן את כל ה-undefined values כדי ש-Firestore לא יקבל שגיאה
        const cleanData: any = {
            courseId: data.courseId,
            title: data.title,
            date: Timestamp.fromDate(data.date),
            instructorId: data.instructorId,
            createdAt: Timestamp.now()
        };

        // מוסיף רק שדות שאינם undefined
        if (data.startTime) cleanData.startTime = data.startTime;
        if (data.endTime) cleanData.endTime = data.endTime;
        if (data.instructorName) cleanData.instructorName = data.instructorName;
        if (data.taughtInLesson) cleanData.taughtInLesson = data.taughtInLesson;
        if (data.description) cleanData.description = data.description;
        if (data.files && data.files.length > 0) cleanData.files = data.files;
        if (data.rating !== undefined && data.rating !== null && data.rating > 0) {
            cleanData.rating = data.rating;
        }
        if (data.attendanceChecked !== undefined) cleanData.attendanceChecked = data.attendanceChecked;

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

// קבלת כל השיעורים (מכל הקורסים)
export const getAllLessons = async (): Promise<Lesson[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'lessons'));
        const lessons = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Lesson));
        
        // מיון לפי תאריך ב-client side
        return lessons.sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת כל השיעורים');
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
        if (data.taughtInLesson !== undefined) updateData.taughtInLesson = data.taughtInLesson;
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
        if (data.attendanceChecked !== undefined) {
            updateData.attendanceChecked = data.attendanceChecked;
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

