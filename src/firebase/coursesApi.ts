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
    editors?: string[]; // uids של משתמשים שיכולים לערוך את הקורס
}

export interface CourseData {
    name: string;
    description: string;
    imageUrl?: string;
    syllabusLink?: string;
    createdBy: string;
    editors?: string[];
}

// יצירת קורס חדש
export const createCourse = async (data: CourseData): Promise<string> => {
    try {
        const courseData: any = {
            name: data.name,
            description: data.description,
            createdBy: data.createdBy,
            createdAt: Timestamp.now()
        };

        if (data.imageUrl) courseData.imageUrl = data.imageUrl;
        if (data.syllabusLink) courseData.syllabusLink = data.syllabusLink;
        if (data.editors && data.editors.length > 0) courseData.editors = data.editors;

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
        const updateData: any = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
        if (data.syllabusLink !== undefined) updateData.syllabusLink = data.syllabusLink || null;
        if (data.editors !== undefined) updateData.editors = data.editors;

        await updateDoc(docRef, updateData);
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

