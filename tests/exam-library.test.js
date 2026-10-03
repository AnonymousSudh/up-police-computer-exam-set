import test from 'node:test';
import assert from 'node:assert/strict';
import { builtInExams, mergeExamLibrary } from '../src/data/exam-library.js';
import { validateExam, gradeExam } from '../src/lib/exam.js';

const fullForms = builtInExams.find(exam => exam.id === 'computer-operator-full-forms');

test('permanent full-form exam appears for new, returning and corrupt-storage users', () => {
  for (const saved of [null, {}, [], [builtInExams[1]], [{ ...fullForms, title: 'Old overwritten title', questions: [fullForms.questions[0]] }]]) {
    const library = mergeExamLibrary(saved);
    assert.equal(library[0], fullForms);
    assert.equal(library.filter(exam => exam.id === fullForms.id).length, 1);
    assert.equal(library[0].questions.length, 300);
  }
});

test('preserves valid custom exams while dropping corrupt or duplicate entries', () => {
  const custom = { ...builtInExams[1], id: 'custom', title: 'My practice set' };
  const library = mergeExamLibrary([custom, null, { ...custom, title: 'Duplicate' }]);
  assert.equal(library.length, builtInExams.length + 1);
  assert.equal(library.at(-1).title, custom.title);
});

test('question bank has valid answers, unique acronyms and traceable references', () => {
  assert.doesNotThrow(() => validateExam(fullForms));
  assert.equal(new Set(fullForms.questions.map(q => q.acronym)).size, 300);
  assert.equal(new Set(fullForms.questions.map(q => q.text)).size, 300);
  assert.equal(fullForms.questions.slice(100).filter(q => q.evidenceKind === 'reference-practice').length, 200);
  const answerPositions = [0, 0, 0, 0];
  for (const q of fullForms.questions) {
    assert.equal(new Set(q.options).size, 4, q.id);
    assert.ok(q.explanation.includes(q.options[q.correctAnswer]), q.id);
    assert.ok(q.references.length > 0, q.id);
    for (const ref of q.references) {
      assert.ok(fullForms.sources[ref.sourceId], `${q.id}: unknown source`);
      assert.equal(new URL(fullForms.sources[ref.sourceId].url).protocol, 'https:');
      assert.ok(ref.locator);
    }
    if (q.evidenceKind === 'archived-paper') assert.ok(q.references.some(ref => ref.sourceId === 'archive'));
    answerPositions[q.correctAnswer]++;
  }
  assert.deepEqual(answerPositions, [75, 75, 75, 75]);
});

test('scores full bank correctly including final question and session-result normalization', () => {
  const normalized = validateExam(fullForms);
  const answers = Object.fromEntries(fullForms.questions.map(q => [q.id, q.correctAnswer]));
  assert.equal(gradeExam(normalized, answers).score, 300);
  delete answers[normalized.questions.at(-1).id];
  assert.equal(gradeExam(normalized, answers).unattemptedCount, 1);
});

test('reference-practice options stay close to the answer instead of using unrelated expansions', () => {
  const words = value => new Set(value.toLowerCase().match(/[a-z0-9]+/g));
  for (const q of fullForms.questions.slice(100)) {
    const answer = q.options[q.correctAnswer];
    const answerWords = words(answer);
    for (const option of q.options) {
      // EXE is a single-word expansion; its alternatives are execution terms.
      if (q.acronym === 'EXE') continue;
      const initials = [...words(option)].map(word => word[0]).join('');
      const acronym = q.acronym.toLowerCase().replace(/[^a-z0-9]/g, '');
      assert.ok(initials === acronym || [...words(option)].some(word => answerWords.has(word)), `${q.id}: unrelated option ${option}`);
    }
  }
});

test('SMPS has four closely related power-supply options', () => {
  const q = fullForms.questions.find(question => question.acronym === 'SMPS');
  assert.equal(q.options[q.correctAnswer], 'Switched Mode Power Supply');
  for (const option of q.options) {
    assert.match(option, /^S\w+ M\w+ Power S\w+$/);
  }
});
