export function validateExam(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('An exam must be a JSON object.');
  if (typeof data.title !== 'string' || !data.title.trim() || data.title.length > 200) throw new Error('Enter an exam title between 1 and 200 characters.');
  const durationMinutes = data.durationMinutes ?? 60;
  if (!Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) throw new Error('Duration must be between 1 and 1440 minutes.');
  if (!Array.isArray(data.questions) || !data.questions.length || data.questions.length > 1000) throw new Error('Include between 1 and 1000 questions.');
  const ids = new Set();
  const questions = data.questions.map((q, index) => {
    const label = `Question ${index + 1}`;
    if (!q || typeof q !== 'object') throw new Error(`${label} must be an object.`);
    const text = q.text ?? q.question;
    if (typeof text !== 'string' || !text.trim()) throw new Error(`${label} needs question text.`);
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 8 || q.options.some(option => typeof option !== 'string' || !option.trim())) throw new Error(`${label} needs 2–8 nonempty text options.`);
    if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) throw new Error(`${label}: correctAnswer must be a valid zero-based option index.`);
    const id = String(q.id ?? `q-${index + 1}`);
    if (!id || ['__proto__', 'constructor', 'prototype'].includes(id) || ids.has(id)) throw new Error(`${label} has an empty or duplicate ID.`);
    ids.add(id);
    return { id, text: text.trim(), options: q.options.map(option => option.trim()), correctAnswer: q.correctAnswer, ...(typeof q.explanation === 'string' ? { explanation: q.explanation } : {}) };
  });
  return { id: String(data.id ?? `custom-${crypto.randomUUID()}`), title: data.title.trim(), durationMinutes, questions };
}

export function readStorage(key, fallback, storage) {
  try { return JSON.parse((storage ?? globalThis.localStorage).getItem(key)) ?? fallback; } catch { return fallback; }
}

export function writeStorage(key, value, storage) {
  try { (storage ?? globalThis.localStorage).setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export function gradeExam(exam, answers) {
  let correctCount = 0, incorrectCount = 0, unattemptedCount = 0;
  for (const q of exam.questions) {
    if (answers[q.id] === undefined) unattemptedCount++;
    else if (answers[q.id] === q.correctAnswer) correctCount++;
    else incorrectCount++;
  }
  return { examTitle: exam.title, totalQuestions: exam.questions.length, score: correctCount, correctCount, incorrectCount, unattemptedCount, answers, exam };
}

export const sessionStore = {
  getItem: key => globalThis.sessionStorage.getItem(key),
  setItem: (key, value) => globalThis.sessionStorage.setItem(key, value),
  removeItem: key => globalThis.sessionStorage.removeItem(key),
};
