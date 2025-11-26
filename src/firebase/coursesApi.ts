import { 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    getDoc, 
    updateDoc, 
    deleteDoc,
    query,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface Course {
    id?: string;
    name: string;
    description: string;
    imageUrl?: string;
    syllabusLink?: string;
    createdAt: Date;
    createdBy: string;
}

export interface CourseData {
    name: string;
    description: string;
    imageUrl?: string;
    syllabusLink?: string;
    createdBy: string;
}

// יצירת קורס חדש
export const createCourse = async (data: CourseData): Promise<string> => {
    try {
        const courseData = {
            ...data,
            createdAt: Timestamp.now()
        };
        const docRef = await addDoc(collection(db, 'courses'), courseData);
        return docRef.id;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה ביצירת קורס');
    }
};

// קבלת כל הקורסים
export const getCourses = async (): Promise<Course[]> => {
    try {
        const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Course));
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת קורסים');
    }
};

// קבלת קורס לפי ID
export const getCourseById = async (courseId: string): Promise<Course | null> => {
    try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: docSnap.data().createdAt?.toDate() || new Date()
            } as Course;
        }
        return null;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת קורס');
    }
};

// עדכון קורס
export const updateCourse = async (courseId: string, data: Partial<CourseData>): Promise<void> => {
    try {
        const docRef = doc(db, 'courses', courseId);
        await updateDoc(docRef, data);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בעדכון קורס');
    }
};

// מחיקת קורס
export const deleteCourse = async (courseId: string): Promise<void> => {
    try {
        const docRef = doc(db, 'courses', courseId);
        await deleteDoc(docRef);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה במחיקת קורס');
    }
};

