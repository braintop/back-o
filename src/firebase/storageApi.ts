import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

// העלאת קובץ ל-Storage
export const uploadFile = async (
    file: File,
    path: string
): Promise<string> => {
    try {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בהעלאת קובץ');
    }
};

// מחיקת קובץ מ-Storage
export const deleteFile = async (path: string): Promise<void> => {
    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה במחיקת קובץ');
    }
};

// פונקציות עזר לנתיבי קבצים
export const getLessonFilePath = (
    courseId: string,
    lessonId: string,
    fileType: 'presentation' | 'worksheet' | 'solutions',
    fileName: string
): string => {
    return `courses/${courseId}/lessons/${lessonId}/${fileType}/${fileName}`;
};

