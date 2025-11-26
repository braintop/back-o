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
    where,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface SharedFile {
    id?: string;
    name: string;
    type: 'presentation' | 'worksheet' | 'solutions';
    url: string;
    description?: string;
    createdAt: Date;
    createdBy: string;
    createdByName?: string;
}

export interface SharedFileData {
    name: string;
    type: 'presentation' | 'worksheet' | 'solutions';
    url: string;
    description?: string;
    createdBy: string;
    createdByName?: string;
}

// יצירת קובץ משותף חדש
export const createSharedFile = async (data: SharedFileData): Promise<string> => {
    try {
        const fileData: any = {
            name: data.name,
            type: data.type,
            url: data.url,
            createdBy: data.createdBy,
            createdAt: Timestamp.now()
        };
        
        // מוסיף רק שדות שאינם undefined
        if (data.description !== undefined && data.description !== null && data.description.trim() !== '') {
            fileData.description = data.description;
        }
        if (data.createdByName) {
            fileData.createdByName = data.createdByName;
        }
        
        const docRef = await addDoc(collection(db, 'sharedFiles'), fileData);
        return docRef.id;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה ביצירת קובץ משותף');
    }
};

// קבלת כל הקבצים המשותפים
export const getSharedFiles = async (type?: 'presentation' | 'worksheet' | 'solutions'): Promise<SharedFile[]> => {
    try {
        let q;
        if (type) {
            q = query(
                collection(db, 'sharedFiles'),
                where('type', '==', type),
                orderBy('createdAt', 'desc')
            );
        } else {
            q = query(collection(db, 'sharedFiles'), orderBy('createdAt', 'desc'));
        }
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
        } as SharedFile));
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת קבצים משותפים');
    }
};

// קבלת קובץ משותף לפי ID
export const getSharedFileById = async (fileId: string): Promise<SharedFile | null> => {
    try {
        const docRef = doc(db, 'sharedFiles', fileId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: docSnap.data().createdAt?.toDate() || new Date()
            } as SharedFile;
        }
        return null;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת קובץ משותף');
    }
};

// עדכון קובץ משותף
export const updateSharedFile = async (fileId: string, data: Partial<SharedFileData>): Promise<void> => {
    try {
        const docRef = doc(db, 'sharedFiles', fileId);
        const updateData: any = {};
        
        if (data.name !== undefined) updateData.name = data.name;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.url !== undefined) updateData.url = data.url;
        if (data.description !== undefined) {
            // אם description ריק, לא נשלח אותו (או נשלח null למחיקה)
            if (data.description === null || data.description.trim() === '') {
                updateData.description = null;
            } else {
                updateData.description = data.description;
            }
        }
        if (data.createdByName !== undefined) {
            updateData.createdByName = data.createdByName;
        }
        
        await updateDoc(docRef, updateData);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בעדכון קובץ משותף');
    }
};

// מחיקת קובץ משותף
export const deleteSharedFile = async (fileId: string): Promise<void> => {
    try {
        const docRef = doc(db, 'sharedFiles', fileId);
        await deleteDoc(docRef);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה במחיקת קובץ משותף');
    }
};

