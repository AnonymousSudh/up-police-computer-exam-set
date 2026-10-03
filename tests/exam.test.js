import test from 'node:test';
import assert from 'node:assert/strict';
import { validateExam, gradeExam, readStorage, writeStorage } from '../src/lib/exam.js';
const exam = { id: 'test', title: 'Example', durationMinutes: 1, questions: [{ id: 'q1', text: 'Choose', options: ['A', 'B'], correctAnswer: 0 }] };
test('validates and normalizes exam imports', () => {
  assert.deepEqual(validateExam(exam), exam);
  assert.equal(validateExam({ ...exam, id: 4 }).id, '4');
  assert.equal(validateExam({ ...exam, durationMinutes: undefined }).durationMinutes, 60);
});
test('rejects unsafe and unusable question structures', () => {
  for (const data of [null, [], { ...exam, title: 3 }, { ...exam, questions: [] }, { ...exam, durationMinutes: -1 }, { ...exam, durationMinutes: '60' }, { ...exam, questions: [null] }, { ...exam, questions: [{ ...exam.questions[0], id: '__proto__' }] }, { ...exam, questions: [{ ...exam.questions[0], correctAnswer: 2 }] }, { ...exam, questions: [{ ...exam.questions[0], options: ['A', null] }] }, { ...exam, questions: [exam.questions[0], exam.questions[0]] }]) assert.throws(() => validateExam(data));
});
test('grades correct, incorrect and unanswered questions', () => {
  const data = { ...exam, questions: [0, 1, 2].map(id => ({ ...exam.questions[0], id: String(id) })) };
  const result = gradeExam(data, { 0: 0, 1: 1 });
  assert.equal(result.score, 1);
  assert.equal(result.incorrectCount, 1);
  assert.equal(result.unattemptedCount, 1);
});
test('handles corrupt and unavailable storage', () => {
  assert.equal(readStorage('x', 'fallback', { getItem: () => '{bad' }), 'fallback');
  assert.equal(readStorage('x', 'fallback', { getItem: () => { throw Error(); } }), 'fallback');
  assert.equal(writeStorage('x', {}, { setItem: () => { throw Error(); } }), false);
});
