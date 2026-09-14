import React, { createContext, useContext, useState, useEffect } from 'react';
import defaultExam from '../data/default-exam.json';

const ExamContext = createContext();

export const ExamProvider = ({ children }) => {
  const [exams, setExams] = useState(() => {
    const saved = localStorage.getItem('up-police-exams');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse exams from localStorage", e);
      }
    }
    return [defaultExam];
  });

  const [currentExamResult, setCurrentExamResult] = useState(null);

  useEffect(() => {
    localStorage.setItem('up-police-exams', JSON.stringify(exams));
  }, [exams]);

  const addExam = (exam) => {
    setExams(prev => [...prev, exam]);
  };

  const getExamById = (id) => {
    return exams.find(e => e.id === id);
  };

  const saveExamResult = (result) => {
    setCurrentExamResult(result);
  };

  return (
    <ExamContext.Provider value={{ 
      exams, 
      addExam, 
      getExamById,
      currentExamResult,
      saveExamResult
    }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => useContext(ExamContext);
