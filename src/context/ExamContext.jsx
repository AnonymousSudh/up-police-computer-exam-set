import { createContext, useContext, useState, useCallback } from 'react';
import { mergeExamLibrary } from '../data/exam-library';
import { readStorage, writeStorage, sessionStore, validateExam, gradeExam } from '../lib/exam';

const ExamContext = createContext();

export const ExamProvider = ({ children }) => {
  const [storageWarning, setStorageWarning] = useState('');
  const [exams, setExams] = useState(() => {
    return mergeExamLibrary(readStorage('up-police-exams', []));
  });
  const [currentExamResult, setCurrentExamResult] = useState(() => {
    const saved = readStorage('up-police-result', null, sessionStore);
    try {
      if (!saved || !saved.answers || !Number.isFinite(saved.score)) return null;
      return gradeExam(validateExam(saved.exam), saved.answers);
    } catch { return null; }
  });
  const addExam = (data) => {
    const exam = validateExam(data);
    if (exams.some(item => item.id === exam.id)) throw new Error('This exam ID already exists. Use a different ID.');
    const next = [...exams, exam];
    if (!writeStorage('up-police-exams', next)) throw new Error('Cannot save this exam. Browser storage may be full or disabled.');
    setExams(next);
  };
  const getExamById = useCallback(id => exams.find(exam => exam.id === id), [exams]);
  const saveExamResult = useCallback(result => {
    setCurrentExamResult(result);
    if (!writeStorage('up-police-result', result, sessionStore)) setStorageWarning('Browser storage is unavailable. Keep this page open to retain your result.');
  }, []);
  return <ExamContext.Provider value={{ exams, addExam, getExamById, currentExamResult, saveExamResult, storageWarning }}>{children}</ExamContext.Provider>;
};

// Context hooks are intentionally exported alongside their provider.
// eslint-disable-next-line react/only-export-components
export const useExam = () => useContext(ExamContext);
