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

export interface VideoCourse {
    id?: string;
    name: string;
    description: string;
    syllabusLink?: string;
    coursePresentationLink?: string;
    imageUrl?: string;
    editorName?: string;
    introVideoUrl?: string;
    isVisible: boolean;
    createdAt: Date;
    createdBy: string;
}

export interface VideoCourseData {
    name: string;
    description: string;
    syllabusLink?: string;
    coursePresentationLink?: string;
    imageUrl?: string;
    editorName?: string;
    introVideoUrl?: string;
    isVisible: boolean;
    createdBy: string;
}

const COLLECTION_NAME = 'videoCourses';

// יצירת קורס וידאו חדש
export const createVideoCourse = async (data: VideoCourseData): Promise<string> => {
    try {
        const courseData: any = {
            name: data.name,
            description: data.description,
            createdBy: data.createdBy,
            isVisible: data.isVisible,
            createdAt: Timestamp.now()
        };

        if (data.syllabusLink) courseData.syllabusLink = data.syllabusLink;
        if (data.coursePresentationLink) courseData.coursePresentationLink = data.coursePresentationLink;
        if (data.imageUrl) courseData.imageUrl = data.imageUrl;
        if (data.editorName) courseData.editorName = data.editorName;
        if (data.introVideoUrl) courseData.introVideoUrl = data.introVideoUrl;

        const docRef = await addDoc(collection(db, COLLECTION_NAME), courseData);
        return docRef.id;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה ביצירת קורס וידאו');
    }
};

// קבלת כל קורסי הווידאו (אופציונלי: לפי visible בלבד)
export const getVideoCourses = async (onlyVisible = false): Promise<VideoCourse[]> => {
    try {
        let q;
        if (onlyVisible) {
            q = query(
                collection(db, COLLECTION_NAME),
                where('isVisible', '==', true)
            );
        } else {
            q = query(collection(db, COLLECTION_NAME));
        }

        const querySnapshot = await getDocs(q);
        const courses = querySnapshot.docs.map(
            (d) =>
                ({
                    id: d.id,
                    ...d.data(),
                    createdAt: d.data().createdAt?.toDate() || new Date()
                } as VideoCourse)
        );

        // מיון בצד הלקוח לפי createdAt יורד, כדי לא לדרוש אינדקס
        return courses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת קורסי וידאו');
    }
};

// קבלת קורס וידאו לפי ID
export const getVideoCourseById = async (courseId: string): Promise<VideoCourse | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, courseId);
        const snap = await getDoc(docRef);

        if (!snap.exists()) return null;

        return {
            id: snap.id,
            ...snap.data(),
            createdAt: snap.data().createdAt?.toDate() || new Date()
        } as VideoCourse;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת קורס וידאו');
    }
};

// עדכון קורס וידאו
export const updateVideoCourse = async (
    courseId: string,
    data: Partial<VideoCourseData>
): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, courseId);
        const updateData: any = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.syllabusLink !== undefined) updateData.syllabusLink = data.syllabusLink || null;
        if (data.coursePresentationLink !== undefined) updateData.coursePresentationLink = data.coursePresentationLink || null;
        if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
        if (data.editorName !== undefined) updateData.editorName = data.editorName || null;
        if (data.introVideoUrl !== undefined) updateData.introVideoUrl = data.introVideoUrl || null;
        if (data.isVisible !== undefined) updateData.isVisible = data.isVisible;

        await updateDoc(docRef, updateData);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בעדכון קורס וידאו');
    }
};

// מחיקת קורס וידאו
export const deleteVideoCourse = async (courseId: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, courseId);
        await deleteDoc(docRef);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה במחיקת קורס וידאו');
    }
};


