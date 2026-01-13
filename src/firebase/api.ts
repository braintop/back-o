import { 
    createUserWithEmailAndPassword, 
    updateProfile,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface RegisterData {
    firstName: string;
    email: string;
    password: string;
    role: 'user' | 'admin' | 'student' | 'teacher';
}

export interface LoginData {
    email: string;
    password: string;
}

export const registerUser = async (data: RegisterData): Promise<User> => {
    if (!auth) {
        throw new Error('Firebase לא מאותחל. אנא הוסף משתני סביבה ב-Vercel Settings > Environment Variables.');
    }
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
        if (!db) {
            throw new Error('Firebase Firestore לא מאותחל. אנא הוסף משתני סביבה ב-Vercel Settings > Environment Variables.');
        }
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: data.firstName,
            email: data.email,
            role: data.role || 'user',
            createdAt: Timestamp.now()
        });

        return user;
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה ברישום המשתמש');
    }
};

export const loginUser = async (data: LoginData): Promise<User> => {
    if (!auth) {
        throw new Error('Firebase לא מאותחל. אנא הוסף משתני סביבה ב-Vercel Settings > Environment Variables.');
    }
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
    if (!auth) {
        throw new Error('Firebase לא מאותחל. אנא הוסף משתני סביבה ב-Vercel Settings > Environment Variables.');
    }
    try {
        await signOut(auth);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה ביציאה');
    }
};

export const resetPassword = async (email: string): Promise<void> => {
    if (!auth) {
        throw new Error('Firebase לא מאותחל. אנא הוסף משתני סביבה ב-Vercel Settings > Environment Variables.');
    }
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        throw new Error(error.message || 'שגיאה בשליחת קישור לאיפוס סיסמה');
    }
};

