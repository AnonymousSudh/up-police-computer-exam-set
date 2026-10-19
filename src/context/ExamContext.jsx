import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { mergeExamLibrary } from '../data/exam-library';
import { readStorage, writeStorage, sessionStore, validateExam, gradeExam } from '../lib/exam';
import {
  saveExamToFirebase,
  fetchExamsFromFirebase,
  deleteExamFromFirebase,
  isFirebaseConfigured
} from '../lib/firebase';

const ExamContext = createContext();

export const ExamProvider = ({ children }) => {
  const [storageWarning, setStorageWarning] = useState('');
  const [exams, setExams] = useState(() => {
    const raw = readStorage('up-police-exams', []);
    const dynamicExams = mergeExamLibrary(raw);
    if (typeof window !== 'undefined' && Array.isArray(raw) && raw.length !== dynamicExams.length) {
      writeStorage('up-police-exams', dynamicExams);
    }
    return dynamicExams;
  });

  const [currentExamResult, setCurrentExamResult] = useState(() => {
    const saved = readStorage('up-police-result', null, sessionStore);
    try {
      if (!saved || !saved.answers || !Number.isFinite(saved.score)) return null;
      return gradeExam(validateExam(saved.exam), saved.answers);
    } catch { return null; }
  });

  // Fetch remote exams from Firebase on mount or config change
  const refreshExams = useCallback(async () => {
    if (!isFirebaseConfigured()) return;
    try {
      const remoteExams = await fetchExamsFromFirebase();
      const localCustom = readStorage('up-police-exams', []);
      const merged = mergeExamLibrary([...localCustom, ...(remoteExams || [])]);
      setExams(merged);
      writeStorage('up-police-exams', merged);
    } catch (err) {
      console.warn('Could not fetch exams from Firebase:', err.message);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!isFirebaseConfigured()) return;

    fetchExamsFromFirebase()
      .then(remoteExams => {
        if (!isMounted) return;
        const localCustom = readStorage('up-police-exams', []);
        const merged = mergeExamLibrary([...localCustom, ...(remoteExams || [])]);
        setExams(merged);
        writeStorage('up-police-exams', merged);
      })
      .catch(err => {
        console.warn('Could not fetch exams from Firebase:', err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const addExam = async (data) => {
    const exam = validateExam(data);
    if (exams.some(item => item.id === exam.id)) {
      throw new Error('This exam ID already exists. Use a different ID or delete the existing one first.');
    }

    let deployedExam = { ...exam, source: 'firebase', isFirebase: true };

    // If Firebase is available, save to Firestore & Storage
    if (isFirebaseConfigured()) {
      try {
        const saved = await saveExamToFirebase(exam);
        deployedExam = { ...deployedExam, ...saved, source: 'firebase', isFirebase: true };
      } catch (fbErr) {
        console.warn('Firebase save notice (falling back to local cache):', fbErr.message);
      }
    }

    const next = [...exams, deployedExam];
    writeStorage('up-police-exams', next);
    setExams(next);
    return deployedExam;
  };

  const deleteExam = async (examId) => {
    if (isFirebaseConfigured()) {
      try {
        await deleteExamFromFirebase(examId);
      } catch (fbErr) {
        console.warn('Firebase delete notice:', fbErr.message);
      }
    }

    const filtered = exams.filter(ex => ex.id !== examId);
    writeStorage('up-police-exams', filtered);
    setExams(filtered);
  };

  const getExamById = useCallback(id => exams.find(exam => exam.id === id), [exams]);

  const saveExamResult = useCallback(result => {
    setCurrentExamResult(result);
    if (!writeStorage('up-police-result', result, sessionStore)) {
      setStorageWarning('Browser storage is unavailable. Keep this page open to retain your result.');
    }
  }, []);

  return (
    <ExamContext.Provider
      value={{
        exams,
        addExam,
        deleteExam,
        refreshExams,
        getExamById,
        currentExamResult,
        saveExamResult,
        storageWarning
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};

// Context hooks are intentionally exported alongside their provider.
// eslint-disable-next-line react/only-export-components
export const useExam = () => useContext(ExamContext);
