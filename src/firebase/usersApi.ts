import { 
    collection, 
    getDocs,
    query,
    orderBy,
    doc,
    getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface User {
    id: string;
    uid: string;
    name: string;
    email: string;
    createdAt: Date;
    role?: 'user' | 'admin' | 'student' | 'teacher';
}

// קבלת כל המשתמשים
export const getUsers = async (): Promise<User[]> => {
    try {
        const q = query(collection(db, 'users'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            role: (doc.data().role as any) || 'user'
        } as User));
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת משתמשים');
    }
};

// קבלת משתמש לפי UID
export const getUserByUid = async (uid: string): Promise<User | null> => {
    try {
        const ref = doc(db, 'users', uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return {
            id: snap.id,
            ...(snap.data() as any),
            createdAt: snap.data().createdAt?.toDate() || new Date(),
            role: (snap.data().role as any) || 'user'
        } as User;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת משתמש');
    }
};

