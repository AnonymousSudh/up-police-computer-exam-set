import defaultExam from './default-exam.json' with { type: 'json' };
import fullFormExam from './full-form-exam.json' with { type: 'json' };
import { validateExam } from '../lib/exam.js';

export const builtInExams = [fullFormExam, defaultExam];

// Built-in exams always come from the shipped library, including for returning
// visitors with older localStorage snapshots. Imports cannot replace these IDs.
export function mergeExamLibrary(saved) {
  const reservedIds = new Set(builtInExams.map(exam => exam.id));
  const custom = [];
  for (const item of Array.isArray(saved) ? saved : []) {
    try {
      const exam = validateExam(item);
      if (reservedIds.has(exam.id)) continue;
      reservedIds.add(exam.id);
      custom.push(exam);
    } catch { /* Ignore corrupt entries without hiding the built-in library. */ }
  }
  return [...builtInExams, ...custom];
}

export function getBuiltInExam(id) {
  return builtInExams.find(exam => exam.id === id);
}
