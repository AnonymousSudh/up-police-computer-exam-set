import defaultExam from './default-exam.json' with { type: 'json' };
import fullFormExam from './full-form-exam.json' with { type: 'json' };

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

export const upPoliceDefaultExam = {
  ...defaultExam,
  category: 'up-police',
};

export const upPoliceExams = [
  simpleFullFormExam,
  hardFullFormExam,
  upPoliceDefaultExam,
];

export default upPoliceExams;
