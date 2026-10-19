import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const STORAGE_KEY_CUSTOM_CONFIG = 'firebase_custom_config_v1';

/**
 * Resolves Firebase configuration in order of priority:
 * 1. Custom config in localStorage (set via Admin UI)
 * 2. Vite environment variables (VITE_FIREBASE_*)
 */
export function getFirebaseConfig() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      }
    } catch {
      // Ignore corrupt storage
    }
  }

  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

  const apiKey = env.VITE_FIREBASE_API_KEY;
  const projectId = env.VITE_FIREBASE_PROJECT_ID;

  if (apiKey && projectId) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY || '',
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId: projectId,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || '',
      measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || ''
    };
  }

  return null;
}

// Cached instances
let cachedApp = null;
let cachedAuth = null;
let cachedDb = null;
let cachedStorage = null;
let cachedAnalytics = null;

function resetCachedInstances() {
  cachedApp = null;
  cachedAuth = null;
  cachedDb = null;
  cachedStorage = null;
  cachedAnalytics = null;
}

export function saveCustomFirebaseConfig(config) {
  if (!config || typeof config !== 'object') {
    localStorage.removeItem(STORAGE_KEY_CUSTOM_CONFIG);
  } else {
    localStorage.setItem(STORAGE_KEY_CUSTOM_CONFIG, JSON.stringify(config));
  }
  resetCachedInstances();
}

export function clearCustomFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY_CUSTOM_CONFIG);
  resetCachedInstances();
}

export function isFirebaseConfigured() {
  const config = getFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
}

export function getFirebaseApp() {
  const config = getFirebaseConfig();
  if (!config) return null;

  try {
    if (cachedApp) return cachedApp;
    if (getApps().length > 0) {
      cachedApp = getApp();
    } else {
      cachedApp = initializeApp(config);
    }
    return cachedApp;
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return null;
  }
}

export function getFirebaseAuth() {
  if (cachedAuth) return cachedAuth;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    cachedAuth = getAuth(app);
    return cachedAuth;
  } catch (err) {
    console.error('Firebase Auth initialization error:', err);
    return null;
  }
}

export function getFirebaseDb() {
  if (cachedDb) return cachedDb;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    cachedDb = getFirestore(app);
    return cachedDb;
  } catch (err) {
    console.error('Firestore initialization error:', err);
    return null;
  }
}

export function getFirebaseStorage() {
  if (cachedStorage) return cachedStorage;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    cachedStorage = getStorage(app);
    return cachedStorage;
  } catch (err) {
    console.error('Firebase Storage initialization error:', err);
    return null;
  }
}

export async function getFirebaseAnalytics() {
  if (cachedAnalytics) return cachedAnalytics;
  const app = getFirebaseApp();
  if (!app || typeof window === 'undefined') return null;
  try {
    const supported = await isSupported();
    if (supported) {
      cachedAnalytics = getAnalytics(app);
      return cachedAnalytics;
    }
  } catch (err) {
    console.warn('Firebase Analytics notice:', err.message);
  }
  return null;
}

/**
 * Authentication Methods
 */
export async function loginWithEmail(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Authentication is not configured yet. Please configure your Firebase project.');
  return await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function registerAdmin(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Authentication is not configured yet. Please configure your Firebase project.');
  return await createUserWithEmailAndPassword(auth, email.trim(), password);
}

export async function resetAdminPassword(email) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Authentication is not configured yet.');
  return await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutUser() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export function subscribeToAuth(callback) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Firestore & Cloud Storage Exam Operations
 */

/**
 * Save an exam paper to Firebase.
 * Writes the raw JSON exam paper to Firebase Cloud Storage under `exams/{id}.json`
 * and records its metadata and question structure in Firestore collection 'exams'.
 */
export async function saveExamToFirebase(examData) {
  if (!examData || !examData.id) throw new Error('Exam must have a valid ID.');

  const db = getFirebaseDb();
  const storage = getFirebaseStorage();

  if (!db && !storage) {
    throw new Error('Firebase is not configured. Please add Firebase credentials.');
  }

  let storageUrl = examData.storageUrl || null;
  const storagePath = `exams/${examData.id}.json`;

  // 1. Upload raw JSON to Firebase Storage bucket under exams/{id}.json
  if (storage) {
    try {
      const storageRef = ref(storage, storagePath);
      const jsonStr = JSON.stringify(examData, null, 2);
      await uploadString(storageRef, jsonStr, 'raw', {
        contentType: 'application/json'
      });
      storageUrl = await getDownloadURL(storageRef);
    } catch (storageErr) {
      console.warn('Firebase Storage upload notice (Firestore will still be saved):', storageErr.message);
    }
  }

  // 2. Prepare clean data for Firestore 'exams' collection
  const payload = {
    ...examData,
    storageUrl: storageUrl || null,
    storagePath,
    source: 'firebase',
    updatedAt: serverTimestamp()
  };

  if (db) {
    const examDocRef = doc(db, 'exams', examData.id);
    await setDoc(examDocRef, payload, { merge: true });
  }

  return { ...payload, storageUrl };
}

/**
 * Fetch all exam sets stored in Firebase Firestore
 */
export async function fetchExamsFromFirebase() {
  const db = getFirebaseDb();
  if (!db) return [];

  try {
    const colRef = collection(db, 'exams');
    const snapshot = await getDocs(colRef);
    const examsList = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      examsList.push({
        ...data,
        id: docSnap.id,
        isFirebase: true
      });
    }

    return examsList;
  } catch (err) {
    console.warn('Error fetching exams from Firestore:', err.message);
    return [];
  }
}

/**
 * Delete an exam set from Firebase Firestore and Cloud Storage
 */
export async function deleteExamFromFirebase(examId) {
  const db = getFirebaseDb();
  const storage = getFirebaseStorage();

  if (!db && !storage) {
    throw new Error('Firebase is not configured.');
  }

  // 1. Delete document in Firestore
  if (db) {
    const examDocRef = doc(db, 'exams', examId);
    await deleteDoc(examDocRef);
  }

  // 2. Delete JSON file from Firebase Storage
  if (storage) {
    try {
      const storageRef = ref(storage, `exams/${examId}.json`);
      await deleteObject(storageRef);
    } catch (storageErr) {
      console.warn('Notice deleting storage file:', storageErr.message);
    }
  }

  return true;
}

/**
 * Helper to download an exam JSON file directly in the browser
 */
export function downloadExamJson(examData) {
  if (!examData) return;
  const jsonStr = JSON.stringify(examData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `${(examData.id || 'exam-set').replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Test connectivity to Firebase Services (Auth, Firestore, Storage)
 */
export async function testFirebaseConnection() {
  const config = getFirebaseConfig();
  if (!config) {
    return { ok: false, error: 'Firebase configuration is missing.' };
  }

  const results = {
    app: false,
    auth: false,
    firestore: false,
    storage: false,
    projectId: config.projectId,
    storageBucket: config.storageBucket
  };

  try {
    const app = getFirebaseApp();
    if (app) results.app = true;

    const auth = getFirebaseAuth();
    if (auth) results.auth = true;

    const db = getFirebaseDb();
    if (db) results.firestore = true;

    const storage = getFirebaseStorage();
    if (storage) results.storage = true;

    return {
      ok: true,
      services: results
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message
    };
  }
}
