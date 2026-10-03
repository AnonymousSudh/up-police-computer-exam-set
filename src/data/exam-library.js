import defaultExam from './default-exam.json' with { type: 'json' };
import fullFormExam from './full-form-exam.json' with { type: 'json' };
import { validateExam } from '../lib/exam.js';

const makeFullFormPart = ({ id, title, badge, questions, durationMinutes, description }) => ({
  ...fullFormExam,
  id,
  title,
  badge,
  durationMinutes,
  description,
  questions,
});

export const simpleFullFormExam = makeFullFormPart({
  id: 'computer-operator-full-forms-simple',
  title: 'Full Form MCQ — Part 1 (Simple)',
  badge: 'Simple',
  durationMinutes: 30,
  description: '100 foundational full-form MCQs covering common computer, hardware, software, networking and office terms.',
  questions: fullFormExam.questions.slice(0, 100),
});

export const hardFullFormExam = makeFullFormPart({
  id: 'computer-operator-full-forms-hard',
  title: 'Full Form MCQ — Part 2 (Hard)',
  badge: 'Hard',
  durationMinutes: 60,
  description: '200 more challenging full-form MCQs covering a wider range of computer, networking and security terms.',
  questions: fullFormExam.questions.slice(100),
});

const retiredBuiltInIds = new Set(['computer-operator-full-forms']);
export const builtInExams = [simpleFullFormExam, hardFullFormExam, defaultExam];

// Built-in exams always come from the shipped library, including for returning
// visitors with older localStorage snapshots. Imports cannot replace these IDs.
export function mergeExamLibrary(saved) {
  const reservedIds = new Set([...builtInExams.map(exam => exam.id), ...retiredBuiltInIds]);
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
