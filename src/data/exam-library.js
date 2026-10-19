import fullFormExam from './full-form-exam.json' with { type: 'json' };
import { EXAM_CATEGORIES, getExamCategoryById } from './exams/categories.js';
import { validateExam } from '../lib/exam.js';

const makeFullFormPart = ({ id, title, badge, questions, durationMinutes, description }) => ({
  ...fullFormExam,
  id,
  title,
  badge,
  category: 'up-police',
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

// All exams are now dynamic (managed via Firebase / Admin Panel upload)
// No static mock tests are bundled in code
export const builtInExams = [];

// Retired static sample IDs
const RETIRED_SAMPLE_IDS = new Set([
  'up-police-comp-op-1',
  'rrb-ntpc-mock-1',
  'computer-operator-full-forms',
]);

// Merges dynamic exams from Firebase and local uploads, filtering out legacy static built-ins
export function mergeExamLibrary(saved) {
  const custom = [];
  const seenIds = new Set();
  for (const item of Array.isArray(saved) ? saved : []) {
    try {
      const exam = validateExam(item);
      // Exclude retired sample mock tests
      if (RETIRED_SAMPLE_IDS.has(exam.id)) continue;
      // Exclude old un-sourced static exams cached in legacy browser localStorage
      if (!item.source && !item.isFirebase && !item.storageUrl && !item.storagePath) continue;
      if (seenIds.has(exam.id)) continue;
      seenIds.add(exam.id);
      custom.push({
        ...exam,
        category: item.category || 'up-police',
        isFirebase: true,
        source: 'firebase',
      });
    } catch {
      // Ignore corrupt entries
    }
  }
  return custom;
}

export function getBuiltInExam(id) {
  return builtInExams.find(exam => exam.id === id);
}

export { EXAM_CATEGORIES, getExamCategoryById };
