export function isBilingualQuestion(q) {
  if (!q) return false;
  return Boolean(
    q.text_hi ||
    q.question_hindi ||
    q.text_en ||
    q.question_english ||
    (Array.isArray(q.options_hi) && q.options_hi.some(Boolean)) ||
    (Array.isArray(q.options_en) && q.options_en.some(Boolean))
  );
}

export function getQuestionText(q, lang = 'en') {
  if (!q) return '';
  const isBilingual = isBilingualQuestion(q);
  if (lang === 'hi') {
    if (q.text_hi && q.text_hi.trim()) return q.text_hi;
    return isBilingual ? 'N/A' : (q.text || 'N/A');
  }
  if (lang === 'en') {
    if (q.text_en && q.text_en.trim()) return q.text_en;
    if (q.text && !isBilingual) return q.text;
    return isBilingual ? 'N/A' : (q.text || 'N/A');
  }
  return q.text_en || q.text || q.text_hi || 'N/A';
}

export function getQuestionOptions(q, lang = 'en') {
  if (!q || !Array.isArray(q.options)) return [];
  const isBilingual = isBilingualQuestion(q);
  if (lang === 'hi' && Array.isArray(q.options_hi) && q.options_hi.length === q.options.length) {
    return q.options_hi.map((opt, i) => (opt && String(opt).trim()) ? opt : (isBilingual ? 'N/A' : (q.options[i] || 'N/A')));
  }
  if (lang === 'en' && Array.isArray(q.options_en) && q.options_en.length === q.options.length) {
    return q.options_en.map((opt, i) => (opt && String(opt).trim()) ? opt : (isBilingual ? 'N/A' : (q.options[i] || 'N/A')));
  }
  return q.options;
}

export function getQuestionExplanation(q, lang = 'en') {
  if (!q) return '';
  const isBilingual = isBilingualQuestion(q);
  if (lang === 'hi') {
    if (q.explanation_hi && String(q.explanation_hi).trim()) return q.explanation_hi;
    return (isBilingual && q.explanation_en) ? 'N/A' : (q.explanation || q.explanation_hi || '');
  }
  if (lang === 'en') {
    if (q.explanation_en && String(q.explanation_en).trim()) return q.explanation_en;
    return (isBilingual && q.explanation_hi) ? 'N/A' : (q.explanation || q.explanation_en || '');
  }
  return q.explanation || q.explanation_hi || '';
}

export function parseExplanationLines(text) {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (!trimmed || trimmed === 'N/A') return [trimmed];

  // 1. If text explicitly has newlines, split on newlines
  if (trimmed.includes('\n')) {
    return trimmed
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  }

  // 2. If numbered list in a single line e.g. "1. First step 2. Second step"
  if (/\b1\.\s+.*\b2\.\s+/.test(trimmed)) {
    return trimmed
      .split(/(?=\b\d+\.\s+)/)
      .map(line => line.trim())
      .filter(Boolean);
  }

  // 3. If Hindi text with danda (।) followed by text (e.g. "किमी। कुल समय = ...")
  if (/।\s+[^\s]/.test(trimmed)) {
    const parts = trimmed.split(/।\s+/);
    return parts
      .map((part, idx) => {
        const clean = part.trim();
        if (!clean) return '';
        return (idx === parts.length - 1 && !trimmed.endsWith('।')) ? clean : (clean.endsWith('।') ? clean : clean + '।');
      })
      .filter(Boolean);
  }

  // 4. If English text with formulas/calculations containing multiple sentences
  if (/[=+\-*/]/.test(trimmed) && /\.\s+[A-Z0-9]/.test(trimmed)) {
    const parts = trimmed.split(/\.\s+(?=[A-Z0-9])/);
    return parts
      .map((part, idx) => {
        const clean = part.trim();
        if (!clean) return '';
        return (idx === parts.length - 1 && !trimmed.endsWith('.')) ? clean : (clean.endsWith('.') ? clean : clean + '.');
      })
      .filter(Boolean);
  }

  return [trimmed];
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

      const effectiveOpt = (optEn && optEn !== 'N/A') ? optEn : ((optHi && optHi !== 'N/A') ? optHi : (optEn || optHi));
      options.push(effectiveOpt);
      options_en.push(optEn || (hasObjectOptions ? 'N/A' : effectiveOpt));
      options_hi.push(optHi || (hasObjectOptions ? 'N/A' : effectiveOpt));
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

    const isBilingual = Boolean(text_hi || options_hi.some(h => h && h !== options_en[options_hi.indexOf(h)]) || explanation_hi || hasObjectOptions || q.question_hindi || q.question_english);

    const questionItem = {
      id,
      text: mainText,
      options,
      correctAnswer: resolvedCorrectAnswer,
      ...(explanation ? { explanation } : {}),
    };

    if (isBilingual) {
      questionItem.text_en = text_en || 'N/A';
      questionItem.text_hi = text_hi || 'N/A';
      questionItem.options_en = options_en;
      questionItem.options_hi = options_hi;
      questionItem.option_labels = option_labels;
      if (explanation_en) questionItem.explanation_en = explanation_en;
      if (explanation_hi) questionItem.explanation_hi = explanation_hi;
      if (q.question_number !== undefined) questionItem.question_number = q.question_number;
    }

    return questionItem;
  });

  const result = { id: String(data.id ?? `custom-${crypto.randomUUID()}`), title, durationMinutes, questions };
  if (data.badge) result.badge = String(data.badge).trim();
  if (data.description) result.description = String(data.description).trim();
  if (data.category) result.category = String(data.category).trim();
  if (data.researchNote) result.researchNote = String(data.researchNote).trim();
  return result;
}

export function readStorage(key, fallback, storage) {
  try { return JSON.parse((storage ?? globalThis.localStorage).getItem(key)) ?? fallback; } catch { return fallback; }
}

export function writeStorage(key, value, storage) {
  try { (storage ?? globalThis.localStorage).setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  if (total === 0) return '0s';
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    if (minutes === 0 && secs === 0) return `${hours}h`;
    if (secs === 0) return `${hours}h ${minutes}m`;
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    if (secs === 0) return `${minutes}m`;
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function formatTimer(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const mm = minutes.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');

  if (hours > 0) {
    const hh = hours.toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function gradeExam(exam, answers, questionTimes = {}, totalTimeSpent = 0) {
  let correctCount = 0, incorrectCount = 0, unattemptedCount = 0;
  for (const q of exam.questions) {
    if (answers[q.id] === undefined) unattemptedCount++;
    else if (answers[q.id] === q.correctAnswer) correctCount++;
    else incorrectCount++;
  }

  const safeQuestionTimes = {};
  if (questionTimes && typeof questionTimes === 'object' && !Array.isArray(questionTimes)) {
    for (const [qid, sec] of Object.entries(questionTimes)) {
      if (Number.isFinite(sec) && sec >= 0) {
        safeQuestionTimes[qid] = Math.floor(sec);
      }
    }
  }

  let calculatedTotal = Number.isFinite(totalTimeSpent) && totalTimeSpent >= 0 ? Math.floor(totalTimeSpent) : 0;
  const sumTimes = Object.values(safeQuestionTimes).reduce((acc, t) => acc + t, 0);
  if (calculatedTotal === 0 && sumTimes > 0) {
    calculatedTotal = sumTimes;
  }

  return {
    examTitle: exam.title,
    totalQuestions: exam.questions.length,
    score: correctCount,
    correctCount,
    incorrectCount,
    unattemptedCount,
    answers,
    exam,
    questionTimes: safeQuestionTimes,
    totalTimeSpent: calculatedTotal
  };
}

export const sessionStore = {
  getItem: key => globalThis.sessionStorage.getItem(key),
  setItem: (key, value) => globalThis.sessionStorage.setItem(key, value),
  removeItem: key => globalThis.sessionStorage.removeItem(key),
};
