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

test('validates and normalizes bilingual exams with question_number, object options, and label resolution', async () => {
  const { isBilingualQuestion, getQuestionText, getQuestionOptions, getQuestionExplanation } = await import('../src/lib/exam.js');

  const bilingualInput = {
    questions: [
      {
        question_number: 188,
        question_hindi: 'किसी डॉक्यूमेंट को प्रिंट करने के लिए—',
        question_english: 'To print a document—',
        options: [
          { option_label: 'a', option_text_hindi: 'प्रिंट कमांड सेलेक्ट करें और तब ओके करें', option_text_english: 'Select the Print command and then click OK.' },
          { option_label: 'b', option_text_hindi: 'रेडी प्रिंटर कमांड सेलेक्ट करें तब ओके करें', option_text_english: 'Select the Ready Printer command and then click OK.' },
          { option_label: 'c', option_text_hindi: 'प्रिन्ट (Print) टाइप करने के बाद एंटर प्रेस करें', option_text_english: 'Type Print and then press Enter.' },
          { option_label: 'd', option_text_hindi: 'डॉक्यूमेंट क्लोज करें, प्रिंट कमांड सेलेक्ट करें तब ओके करें', option_text_english: 'Close the document, select the Print command, and then click OK.' },
          { option_label: 'e', option_text_hindi: 'उपरोक्त में से कोई नहीं', option_text_english: 'None of the above.' }
        ],
        correct_option_label: 'a',
        correct_answer_hindi: 'प्रिंट कमांड सेलेक्ट करें और तब ओके करें',
        correct_answer_english: 'Select the Print command and then click OK.',
        explanation_hindi: 'डॉक्यूमेंट प्रिंट करने के लिए कंप्यूटर से प्रिंटर कनेक्ट करें।',
        explanation_english: 'To print a document, connect a printer to the computer.'
      },
      {
        question_number: 189,
        question_hindi: 'स्टोरेज डिवाइस का मेन फोल्डर कहलाता है—',
        question_english: 'The main folder of a storage device is called—',
        options: [
          { option_label: 'a', option_text_hindi: 'प्लेटफॉर्म', option_text_english: 'Platform' },
          { option_label: 'b', option_text_hindi: 'इंटरफेस', option_text_english: 'Interface' },
          { option_label: 'c', option_text_hindi: 'रूट डायरेक्टरी', option_text_english: 'Root directory' },
          { option_label: 'd', option_text_hindi: 'डिवाइस ड्राइवर', option_text_english: 'Device driver' },
          { option_label: 'e', option_text_hindi: 'उपरोक्त में से कोई नहीं', option_text_english: 'None of the above.' }
        ],
        correct_option_label: 'c',
        correct_answer_hindi: 'रूट डायरेक्टरी',
        correct_answer_english: 'Root directory',
        explanation_hindi: 'रूट डायरेक्टरी सबसे ऊपरी स्तर की डायरेक्टरी होती है।',
        explanation_english: 'The root directory is the top-level directory.'
      }
    ]
  };

  const parsed = validateExam(bilingualInput);
  assert.equal(parsed.title, 'Imported Exam Set');
  assert.equal(parsed.durationMinutes, 60);
  assert.equal(parsed.questions.length, 2);

  const q1 = parsed.questions[0];
  assert.equal(q1.id, 'q-188');
  assert.equal(q1.correctAnswer, 0); // 'a' -> 0
  assert.equal(isBilingualQuestion(q1), true);
  assert.equal(getQuestionText(q1, 'en'), 'To print a document—');
  assert.equal(getQuestionText(q1, 'hi'), 'किसी डॉक्यूमेंट को प्रिंट करने के लिए—');
  assert.equal(getQuestionOptions(q1, 'en')[0], 'Select the Print command and then click OK.');
  assert.equal(getQuestionOptions(q1, 'hi')[0], 'प्रिंट कमांड सेलेक्ट करें और तब ओके करें');
  assert.equal(getQuestionExplanation(q1, 'en'), 'To print a document, connect a printer to the computer.');
  assert.equal(getQuestionExplanation(q1, 'hi'), 'डॉक्यूमेंट प्रिंट करने के लिए कंप्यूटर से प्रिंटर कनेक्ट करें।');

  const q2 = parsed.questions[1];
  assert.equal(q2.id, 'q-189');
  assert.equal(q2.correctAnswer, 2); // 'c' -> 2
  assert.equal(getQuestionText(q2, 'en'), 'The main folder of a storage device is called—');
  assert.equal(getQuestionText(q2, 'hi'), 'स्टोरेज डिवाइस का मेन फोल्डर कहलाता है—');
  assert.equal(getQuestionOptions(q2, 'en')[2], 'Root directory');
  assert.equal(getQuestionOptions(q2, 'hi')[2], 'रूट डायरेक्टरी');

  // Verify re-validation round trip (e.g. from session storage)
  const revalidated = validateExam(parsed);
  assert.equal(revalidated.questions[0].correctAnswer, 0);
  assert.equal(revalidated.questions[0].options_hi[0], 'प्रिंट कमांड सेलेक्ट करें और तब ओके करें');
  assert.equal(revalidated.questions[1].correctAnswer, 2);
});

test('shows N/A when English or Hindi version is not available in bilingual questions', async () => {
  const { getQuestionText, getQuestionOptions } = await import('../src/lib/exam.js');
  const input = {
    title: 'Partial Translation Exam',
    questions: [
      {
        question_number: 1,
        question_hindi: 'भारत की राजधानी क्या है?',
        options: [
          { option_label: 'a', option_text_hindi: 'नई दिल्ली' },
          { option_label: 'b', option_text_hindi: 'मुंबई' }
        ],
        correct_option_label: 'a'
      },
      {
        question_number: 2,
        question_english: 'What is the capital of France?',
        options: [
          { option_label: 'a', option_text_english: 'Paris' },
          { option_label: 'b', option_text_english: 'Rome' }
        ],
        correct_option_label: 'a'
      }
    ]
  };

  const parsed = validateExam(input);
  // Question 1: English not available -> shows N/A
  assert.equal(getQuestionText(parsed.questions[0], 'hi'), 'भारत की राजधानी क्या है?');
  assert.equal(getQuestionText(parsed.questions[0], 'en'), 'N/A');
  assert.equal(getQuestionOptions(parsed.questions[0], 'hi')[0], 'नई दिल्ली');
  assert.equal(getQuestionOptions(parsed.questions[0], 'en')[0], 'N/A');

  // Question 2: Hindi not available -> shows N/A
  assert.equal(getQuestionText(parsed.questions[1], 'en'), 'What is the capital of France?');
  assert.equal(getQuestionText(parsed.questions[1], 'hi'), 'N/A');
  assert.equal(getQuestionOptions(parsed.questions[1], 'en')[0], 'Paris');
  assert.equal(getQuestionOptions(parsed.questions[1], 'hi')[0], 'N/A');
});

test('parses and splits explanations into structured next-line steps with indentation', async () => {
  const { parseExplanationLines } = await import('../src/lib/exam.js');

  // Case 1: Text with explicit newlines
  const withNewlines = "• Step 1\n• Step 2\n• Step 3";
  assert.deepEqual(parseExplanationLines(withNewlines), ["• Step 1", "• Step 2", "• Step 3"]);

  // Case 2: Hindi single-line calculation with danda (।)
  const hindiSingleLine = "कुल दूरी = (2 * 60) + 80 = 120 + 80 = 200 किमी। कुल समय = 2 + (80 / 40) = 2 + 2 = 4 घंटे। औसत चाल = 200 / 4 = 50 किमी/घंटा।";
  const parsedHindi = parseExplanationLines(hindiSingleLine);
  assert.equal(parsedHindi.length, 3);
  assert.equal(parsedHindi[0], "कुल दूरी = (2 * 60) + 80 = 120 + 80 = 200 किमी।");
  assert.equal(parsedHindi[1], "कुल समय = 2 + (80 / 40) = 2 + 2 = 4 घंटे।");
  assert.equal(parsedHindi[2], "औसत चाल = 200 / 4 = 50 किमी/घंटा।");

  // Case 3: English single-line calculation with formulas
  const englishSingleLine = "Total distance = (2 * 60) + 80 = 120 + 80 = 200 km. Total time = 2 + (80 / 40) = 2 + 2 = 4 hours. Average speed = 200 / 4 = 50 km/h.";
  const parsedEnglish = parseExplanationLines(englishSingleLine);
  assert.equal(parsedEnglish.length, 3);
  assert.equal(parsedEnglish[0], "Total distance = (2 * 60) + 80 = 120 + 80 = 200 km.");
  assert.equal(parsedEnglish[1], "Total time = 2 + (80 / 40) = 2 + 2 = 4 hours.");
  assert.equal(parsedEnglish[2], "Average speed = 200 / 4 = 50 km/h.");

  // Case 4: Non-math text should not accidentally split abbreviations like Dr. B. R. Ambedkar
  const normalText = "Dr. B. R. Ambedkar was the Chairman of the Drafting Committee.";
  assert.deepEqual(parseExplanationLines(normalText), ["Dr. B. R. Ambedkar was the Chairman of the Drafting Committee."]);

  // Case 5: Empty and N/A handling
  assert.deepEqual(parseExplanationLines(""), []);
  assert.deepEqual(parseExplanationLines("N/A"), ["N/A"]);
});



