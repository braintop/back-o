import { 
    collection, 
    getDocs,
    query,
    orderBy
} from 'firebase/firestore';
import { db } from './firebase';

export interface User {
    id: string;
    uid: string;
    name: string;
    email: string;
    createdAt: Date;
}

// קבלת כל המשתמשים
export const getUsers = async (): Promise<User[]> => {
    try {
        const q = query(collection(db, 'users'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
        } as User));
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בקבלת משתמשים');
    }
};

