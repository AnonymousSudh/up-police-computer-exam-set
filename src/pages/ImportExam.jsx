import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

const ImportExam = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { addExam } = useExam();
  const navigate = useNavigate();
  const redirectTimer = useRef(null);
  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  const handleImport = () => {
    setError('');
    setSuccess('');
    
    try {
      if (!jsonInput.trim()) {
        throw new Error('Please enter JSON text.');
      }
      const parsedData = JSON.parse(jsonInput);
      
      if (jsonInput.length > 2_000_000) throw new Error('Exam JSON must be smaller than 2 MB.');
      addExam(parsedData);
      setSuccess('Exam imported successfully! Redirecting to home...');
      setJsonInput('');
      
      redirectTimer.current = setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (err) {
      setError(err.message || 'Invalid JSON format.');
    }
  };

  return (
    <div className="import-container">
      <div className="import-card">
        <div className="import-header">
          <UploadCloud size={32} className="import-icon" />
          <h2>Import Custom Exam Set</h2>
          <p>Paste your exam JSON configuration below.</p>
        </div>

        <div className="import-body">
          <div className="import-format-bar">
            <label htmlFor="exam-json">Exam JSON</label>
            <div className="sample-buttons">
              <button
                type="button"
                className="btn-sample"
                onClick={() => setJsonInput(JSON.stringify({
                  title: "UP Police Computer Operator Mock Test",
                  durationMinutes: 60,
                  questions: [
                    {
                      question_number: 188,
                      question_hindi: "किसी डॉक्यूमेंट को प्रिंट करने के लिए—",
                      question_english: "To print a document—",
                      options: [
                        { option_label: "a", option_text_hindi: "प्रिंट कमांड सेलेक्ट करें और तब ओके करें", option_text_english: "Select the Print command and then click OK." },
                        { option_label: "b", option_text_hindi: "रेडी प्रिंटर कमांड सेलेक्ट करें तब ओके करें", option_text_english: "Select the Ready Printer command and then click OK." },
                        { option_label: "c", option_text_hindi: "प्रिन्ट (Print) टाइप करने के बाद एंटर प्रेस करें", option_text_english: "Type Print and then press Enter." },
                        { option_label: "d", option_text_hindi: "डॉक्यूमेंट क्लोज करें, प्रिंट कमांड सेलेक्ट करें तब ओके करें", option_text_english: "Close the document, select the Print command, and then click OK." },
                        { option_label: "e", option_text_hindi: "उपरोक्त में से कोई नहीं", option_text_english: "None of the above." }
                      ],
                      correct_option_label: "a",
                      correct_answer_hindi: "प्रिंट कमांड सेलेक्ट करें और तब ओके करें",
                      correct_answer_english: "Select the Print command and then click OK.",
                      explanation_hindi: "डॉक्यूमेंट प्रिंट करने के लिए कंप्यूटर से प्रिंटर कनेक्ट करें। फिर फ़ाइल मेनू से प्रिंट विकल्प चुनें या Ctrl + P दबाएँ। इसलिए सही विकल्प (a) है।",
                      explanation_english: "To print a document, connect a printer to the computer. Select Print from the File menu or press Ctrl + P. Therefore, option (a) is correct."
                    }
                  ]
                }, null, 2))}
              >
                Load Bilingual Sample (Hindi + English)
              </button>
            </div>
          </div>
          <p className="import-help">
            Supports both bilingual questions (Hindi + English with <code>question_hindi</code>, <code>question_english</code>, <code>correct_option_label</code>) and standard JSON. Exams are saved in this browser.
          </p>
          <textarea
            id="exam-json"
            spellCheck={false}
            aria-describedby={error ? "import-error" : undefined}
            aria-invalid={Boolean(error)}
            className="json-textarea"
            placeholder={`{\n  "title": "Practice Exam",\n  "durationMinutes": 60,\n  "questions": [\n    {\n      "question_number": 1,\n      "question_hindi": "...",\n      "question_english": "...",\n      "options": [\n        { "option_label": "a", "option_text_hindi": "...", "option_text_english": "..." }\n      ],\n      "correct_option_label": "a",\n      "explanation_hindi": "...",\n      "explanation_english": "..."\n    }\n  ]\n}`}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          ></textarea>

          {error && (
            <div id="import-error" role="alert" className="alert error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div role="status" className="alert success-alert">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}
        </div>

        <div className="import-footer">
          <button className="btn-secondary" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button className="btn-primary" disabled={Boolean(success)} onClick={handleImport}>
            Parse & Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExam;
