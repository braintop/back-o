import { 
    createUserWithEmailAndPassword, 
    updateProfile,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface RegisterData {
    firstName: string;
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export const registerUser = async (data: RegisterData): Promise<User> => {
    try {
        // יצירת משתמש עם אימייל וסיסמה
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            data.email,
            data.password
        );

        const user = userCredential.user;

        // עדכון הפרופיל עם השם הפרטי
        await updateProfile(user, {
            displayName: data.firstName
        });

        // שמירת המשתמש ב-Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: data.firstName,
            email: data.email,
            createdAt: Timestamp.now()
        });

        return user;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה ברישום המשתמש');
    }
};

export const loginUser = async (data: LoginData): Promise<User> => {
    try {
        // התחברות עם אימייל וסיסמה
        const userCredential = await signInWithEmailAndPassword(
            auth,
            data.email,
            data.password
        );

        return userCredential.user;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בהתחברות');
    }
};

export const logoutUser = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה ביציאה');
    }
};

