export function isBilingualQuestion(q) {
  return Boolean(q && (q.text_hi || (Array.isArray(q.options_hi) && q.options_hi.some(Boolean))));
}

export function getQuestionText(q, lang = 'en') {
  if (!q) return '';
  if (lang === 'hi' && q.text_hi) return q.text_hi;
  return q.text_en || q.text || q.text_hi || '';
}

export function getQuestionOptions(q, lang = 'en') {
  if (!q || !Array.isArray(q.options)) return [];
  if (lang === 'hi' && Array.isArray(q.options_hi) && q.options_hi.length === q.options.length) {
    return q.options_hi;
  }
  if (lang === 'en' && Array.isArray(q.options_en) && q.options_en.length === q.options.length) {
    return q.options_en;
  }
  return q.options;
}

export function getQuestionExplanation(q, lang = 'en') {
  if (!q) return '';
  if (lang === 'hi' && q.explanation_hi) return q.explanation_hi;
  if (lang === 'en' && q.explanation_en) return q.explanation_en;
  return q.explanation || q.explanation_hi || '';
}

export function validateExam(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('An exam must be a JSON object.');

  let title = 'Imported Exam Set';
  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || !data.title.trim() || data.title.length > 200) {
      throw new Error('Enter an exam title between 1 and 200 characters.');
    }
    title = data.title.trim();
  }

  const durationMinutes = data.durationMinutes ?? 60;
  if (!Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) throw new Error('Duration must be between 1 and 1440 minutes.');
  if (!Array.isArray(data.questions) || !data.questions.length || data.questions.length > 1000) throw new Error('Include between 1 and 1000 questions.');

  const ids = new Set();
  const questions = data.questions.map((q, index) => {
    const label = `Question ${index + 1}`;
    if (!q || typeof q !== 'object') throw new Error(`${label} must be an object.`);

    const text_en = (q.question_english ?? q.text_english ?? q.text_en ?? (typeof q.text === 'string' && !q.question_hindi ? q.text : '') ?? '')?.toString().trim();
    const text_hi = (q.question_hindi ?? q.text_hindi ?? q.text_hi ?? '')?.toString().trim();
    const fallbackText = (typeof q.text === 'string' ? q.text : typeof q.question === 'string' ? q.question : '')?.trim();
    const mainText = text_en || fallbackText || text_hi;

    if (!mainText) throw new Error(`${label} needs question text.`);

    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 8) {
      throw new Error(`${label} needs 2–8 nonempty text options.`);
    }

    const options = [];
    const options_en = [];
    const options_hi = [];
    const option_labels = [];
    let hasObjectOptions = false;

    for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
      const opt = q.options[optIdx];
      let optLabel = String.fromCharCode(97 + optIdx);
      let optEn = '';
      let optHi = '';

      if (typeof opt === 'string') {
        optEn = opt.trim();
        if (Array.isArray(q.options_hi) && typeof q.options_hi[optIdx] === 'string') {
          optHi = q.options_hi[optIdx].trim();
        }
        if (Array.isArray(q.options_en) && typeof q.options_en[optIdx] === 'string') {
          optEn = q.options_en[optIdx].trim();
        }
        if (Array.isArray(q.option_labels) && typeof q.option_labels[optIdx] === 'string') {
          optLabel = q.option_labels[optIdx].trim();
        }
        if (!optEn && !optHi) throw new Error(`${label} has empty option text.`);
      } else if (opt && typeof opt === 'object') {
        hasObjectOptions = true;
        if (opt.option_label !== undefined || opt.label !== undefined) {
          optLabel = String(opt.option_label ?? opt.label).trim();
        }
        optEn = (opt.option_text_english ?? opt.text_english ?? opt.text_en ?? opt.text ?? opt.english ?? '')?.toString().trim();
        optHi = (opt.option_text_hindi ?? opt.text_hindi ?? opt.text_hi ?? opt.hindi ?? '')?.toString().trim();
        if (!optEn && !optHi) throw new Error(`${label} has empty option text.`);
      } else {
        throw new Error(`${label} option ${optIdx + 1} must be text or an option object.`);
      }

      const effectiveOpt = optEn || optHi;
      options.push(effectiveOpt);
      options_en.push(optEn || effectiveOpt);
      options_hi.push(optHi || effectiveOpt);
      option_labels.push(optLabel);
    }

    let resolvedCorrectAnswer = null;
    if (Number.isInteger(q.correctAnswer) && q.correctAnswer >= 0 && q.correctAnswer < options.length) {
      resolvedCorrectAnswer = q.correctAnswer;
    } else if (Number.isInteger(q.correct_answer) && q.correct_answer >= 0 && q.correct_answer < options.length) {
      resolvedCorrectAnswer = q.correct_answer;
    } else {
      const labelTarget = String(q.correct_option_label ?? q.correctOptionLabel ?? q.correct_option ?? '').trim().toLowerCase();
      if (labelTarget) {
        const foundIdx = option_labels.findIndex(lbl => lbl.toLowerCase() === labelTarget);
        if (foundIdx !== -1) {
          resolvedCorrectAnswer = foundIdx;
        } else if (labelTarget.length === 1) {
          const letterCode = labelTarget.charCodeAt(0) - 97;
          if (letterCode >= 0 && letterCode < options.length) {
            resolvedCorrectAnswer = letterCode;
          }
        }
      }

      if (resolvedCorrectAnswer === null) {
        const textTargets = [
          q.correct_answer_english,
          q.correct_answer_hindi,
          q.correct_answer,
        ].filter(t => typeof t === 'string' && t.trim()).map(t => t.trim().toLowerCase());

        for (const target of textTargets) {
          const matchEn = options_en.findIndex(o => o.toLowerCase() === target);
          if (matchEn !== -1) { resolvedCorrectAnswer = matchEn; break; }
          const matchHi = options_hi.findIndex(o => o.toLowerCase() === target);
          if (matchHi !== -1) { resolvedCorrectAnswer = matchHi; break; }
          const matchDef = options.findIndex(o => o.toLowerCase() === target);
          if (matchDef !== -1) { resolvedCorrectAnswer = matchDef; break; }
        }
      }
    }

    if (!Number.isInteger(resolvedCorrectAnswer) || resolvedCorrectAnswer < 0 || resolvedCorrectAnswer >= options.length) {
      throw new Error(`${label}: correctAnswer must be a valid zero-based option index.`);
    }

    const explanation_en = (q.explanation_english ?? q.explanation_en ?? (typeof q.explanation === 'string' ? q.explanation : ''))?.toString().trim();
    const explanation_hi = (q.explanation_hindi ?? q.explanation_hi)?.toString().trim();
    const explanation = explanation_en || explanation_hi || (typeof q.explanation === 'string' ? q.explanation.trim() : '');

    const rawId = q.id ?? (q.question_number !== undefined ? `q-${q.question_number}` : `q-${index + 1}`);
    const id = String(rawId).trim();
    if (!id || ['__proto__', 'constructor', 'prototype'].includes(id) || ids.has(id)) {
      throw new Error(`${label} has an empty or duplicate ID.`);
    }
    ids.add(id);

    const isBilingual = Boolean(text_hi || options_hi.some(h => h && h !== options_en[options_hi.indexOf(h)]) || explanation_hi || hasObjectOptions);

    const questionItem = {
      id,
      text: mainText,
      options,
      correctAnswer: resolvedCorrectAnswer,
      ...(explanation ? { explanation } : {}),
    };

    if (isBilingual) {
      if (text_en) questionItem.text_en = text_en;
      if (text_hi) questionItem.text_hi = text_hi;
      questionItem.options_en = options_en;
      questionItem.options_hi = options_hi;
      questionItem.option_labels = option_labels;
      if (explanation_en) questionItem.explanation_en = explanation_en;
      if (explanation_hi) questionItem.explanation_hi = explanation_hi;
      if (q.question_number !== undefined) questionItem.question_number = q.question_number;
    }

    return questionItem;
  });

  return { id: String(data.id ?? `custom-${crypto.randomUUID()}`), title, durationMinutes, questions };
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
