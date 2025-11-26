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

export interface VideoLesson {
    id?: string;
    courseId: string;
    chapterId: string;
    title: string;
    description?: string;
    richText?: string;
    vimeoUrl?: string;
    youtubeUrl?: string;
    order: number;
    createdAt: Date;
}

export interface VideoLessonData {
    courseId: string;
    chapterId: string;
    title: string;
    description?: string;
    richText?: string;
    vimeoUrl?: string;
    youtubeUrl?: string;
    order: number;
}

const COLLECTION_NAME = 'videoLessons';

// יצירת שיעור וידאו חדש
export const createVideoLesson = async (data: VideoLessonData): Promise<string> => {
    try {
        const lessonData: any = {
            courseId: data.courseId,
            chapterId: data.chapterId,
            title: data.title,
            order: data.order,
            createdAt: Timestamp.now()
        };

        if (data.description) lessonData.description = data.description;
        if (data.richText) lessonData.richText = data.richText;
        if (data.vimeoUrl) lessonData.vimeoUrl = data.vimeoUrl;
        if (data.youtubeUrl) lessonData.youtubeUrl = data.youtubeUrl;

        const docRef = await addDoc(collection(db, COLLECTION_NAME), lessonData);
        return docRef.id;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה ביצירת שיעור וידאו');
    }
};

// קבלת כל שיעורי הווידאו של פרק מסוים
export const getVideoLessonsByChapterId = async (chapterId: string): Promise<VideoLesson[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('chapterId', '==', chapterId)
        );
        const snapshot = await getDocs(q);
        const lessons = snapshot.docs.map(
            (d) =>
                ({
                    id: d.id,
                    ...d.data(),
                    createdAt: d.data().createdAt?.toDate() || new Date()
                } as VideoLesson)
        );

        // מיון בצד הלקוח לפי order כדי לא לדרוש אינדקס
        return lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת שיעורי וידאו');
    }
};

// קבלת שיעור וידאו לפי ID
export const getVideoLessonById = async (lessonId: string): Promise<VideoLesson | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, lessonId);
        const snap = await getDoc(docRef);

        if (!snap.exists()) return null;

        return {
            id: snap.id,
            ...snap.data(),
            createdAt: snap.data().createdAt?.toDate() || new Date()
        } as VideoLesson;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת שיעור וידאו');
    }
};

// עדכון שיעור וידאו
export const updateVideoLesson = async (
    lessonId: string,
    data: Partial<VideoLessonData>
): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, lessonId);
        const updateData: any = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description || null;
        if (data.richText !== undefined) updateData.richText = data.richText || null;
        if (data.vimeoUrl !== undefined) updateData.vimeoUrl = data.vimeoUrl || null;
        if (data.youtubeUrl !== undefined) updateData.youtubeUrl = data.youtubeUrl || null;
        if (data.order !== undefined) updateData.order = data.order;

        await updateDoc(docRef, updateData);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בעדכון שיעור וידאו');
    }
};

// מחיקת שיעור וידאו
export const deleteVideoLesson = async (lessonId: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, lessonId);
        await deleteDoc(docRef);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה במחיקת שיעור וידאו');
    }
};


