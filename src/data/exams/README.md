# Multi-Exam Question Bank Structure

This project organizes mock tests and question banks by examination stream in dedicated folders:

```
src/data/exams/
├── categories.js            # Configuration & metadata for each exam stream
├── up-police/               # UP Police exams folder
│   ├── default-exam.json    # Standard mock test
│   ├── full-form-exam.json  # 300 Computer Operator acronym bank
│   └── index.js             # Exports for UP Police
└── rrb/                     # RRB (Railway Recruitment Board) exams folder
    ├── rrb-ntpc-mock-1.json # Bilingual RRB mock test (NTPC/Group D)
    └── index.js             # Exports for RRB
```

## Adding Questions / New Exam JSON

When you provide a JSON question list:
1. **For RRB Exam**: Drop your JSON file into `src/data/exams/rrb/<your-exam-name>.json` and export it in `src/data/exams/rrb/index.js`.
2. **For UP Police**: Drop your JSON into `src/data/exams/up-police/<your-exam-name>.json`.
3. **For New Exams (e.g. SSC, Banking, etc.)**:
   - Create a new directory `src/data/exams/<exam-id>/`
   - Add your JSON file
   - Register the new category in `src/data/exams/categories.js`

## Supported JSON Format

Standard format:
```json
{
  "id": "unique-exam-id",
  "title": "Exam Title",
  "category": "rrb",
  "durationMinutes": 60,
  "badge": "Optional Badge",
  "description": "Exam Description",
  "questions": [
    {
      "id": "q1",
      "text": "Question text in English",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why Option A is correct"
    }
  ]
}
```

Bilingual format (Hindi & English):
```json
{
  "id": "unique-exam-id",
  "title": "Bilingual Exam Title",
  "category": "rrb",
  "durationMinutes": 60,
  "questions": [
    {
      "question_number": 1,
      "question_english": "Question in English",
      "question_hindi": "हिंदी में प्रश्न",
      "options": [
        { "option_label": "a", "option_text_english": "Eng Opt", "option_text_hindi": "हिंदी विकल्प" },
        { "option_label": "b", "option_text_english": "Eng Opt", "option_text_hindi": "हिंदी विकल्प" }
      ],
      "correct_option_label": "a",
      "explanation_english": "English explanation",
      "explanation_hindi": "हिंदी व्याख्या"
    }
  ]
}
```
