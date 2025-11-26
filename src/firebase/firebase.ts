// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName] || import.meta.env[varName] === ''
);

if (missingVars.length > 0) {
  const errorMessage = `Missing Firebase environment variables: ${missingVars.join(', ')}. Please configure them in Vercel Settings > Environment Variables.`;
  console.error('Firebase Configuration Error:', errorMessage);
  console.error('Missing variables:', missingVars);
  
  // Don't throw error immediately - let the app load and show error in UI
  // This way users can see what's wrong instead of blank page
}

// Initialize Firebase only if config is valid
let app;
let auth: any;
let db: any;
let storage: any;

try {
  if (missingVars.length === 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } else {
    // Create dummy instances to prevent crashes
    console.warn('Firebase not initialized due to missing environment variables');
    // Set to null so components can check and show error
    auth = null;
    db = null;
    storage = null;
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  auth = null;
  db = null;
  storage = null;
}

export { auth, db, storage };
