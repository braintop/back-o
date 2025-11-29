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

export interface VideoChapter {
    id?: string;
    courseId: string;
    title: string;
    order: number;
    createdAt: Date;
    presentationLink?: string;
    homeworkLink?: string;
    classworkLink?: string;
}

export interface VideoChapterData {
    courseId: string;
    title: string;
    order: number;
    presentationLink?: string;
    homeworkLink?: string;
    classworkLink?: string;
}

const COLLECTION_NAME = 'videoChapters';

// יצירת פרק חדש
export const createVideoChapter = async (data: VideoChapterData): Promise<string> => {
    try {
        const chapterData: any = {
            courseId: data.courseId,
            title: data.title,
            order: data.order,
            createdAt: Timestamp.now()
        };

        if (data.presentationLink !== undefined) chapterData.presentationLink = data.presentationLink;
        if (data.homeworkLink !== undefined) chapterData.homeworkLink = data.homeworkLink;
        if (data.classworkLink !== undefined) chapterData.classworkLink = data.classworkLink;

        const docRef = await addDoc(collection(db, COLLECTION_NAME), chapterData);
        return docRef.id;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה ביצירת פרק');
    }
};

// קבלת כל הפרקים של קורס מסוים
export const getChaptersByCourseId = async (courseId: string): Promise<VideoChapter[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('courseId', '==', courseId)
        );
        const snapshot = await getDocs(q);
        const chapters = snapshot.docs.map(
            (d) =>
                ({
                    id: d.id,
                    ...d.data(),
                    createdAt: d.data().createdAt?.toDate() || new Date()
                } as VideoChapter)
        );

        // מיון בצד הלקוח לפי order כדי לא לדרוש אינדקס
        return chapters.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת פרקים');
    }
};

// קבלת פרק לפי ID
export const getVideoChapterById = async (chapterId: string): Promise<VideoChapter | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, chapterId);
        const snap = await getDoc(docRef);

        if (!snap.exists()) return null;

        return {
            id: snap.id,
            ...snap.data(),
            createdAt: snap.data().createdAt?.toDate() || new Date()
        } as VideoChapter;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת פרק');
    }
};

// עדכון פרק
export const updateVideoChapter = async (
    chapterId: string,
    data: Partial<Pick<VideoChapterData, 'title' | 'order' | 'presentationLink' | 'homeworkLink' | 'classworkLink'>>
): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, chapterId);
        const updateData: any = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.order !== undefined) updateData.order = data.order;
        if (data.presentationLink !== undefined) updateData.presentationLink = data.presentationLink || null;
        if (data.homeworkLink !== undefined) updateData.homeworkLink = data.homeworkLink || null;
        if (data.classworkLink !== undefined) updateData.classworkLink = data.classworkLink || null;

        await updateDoc(docRef, updateData);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בעדכון פרק');
    }
};

// מחיקת פרק
export const deleteVideoChapter = async (chapterId: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, chapterId);
        await deleteDoc(docRef);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה במחיקת פרק');
    }
};


