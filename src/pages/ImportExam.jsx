 import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { UploadCloud, CheckCircle2, AlertCircle, Camera, Copy, Check, X } from 'lucide-react';

export const AI_IMAGE_OCR_PROMPT = `You are an expert exam question digitizer, bilingual translator, and OCR specialist. I am uploading a photo (or photos) of multiple-choice questions from a competitive exam book or question paper.

Your task is to transcribe and digitize EVERY question in the image and output them strictly as a single, valid JSON object matching the exact schema below.

### STRICT RULES & AUTOMATIC BILINGUAL TRANSLATION:
1. Output ONLY valid, raw JSON. Do NOT wrap in markdown fences (no \`\`\`json or \`\`\`). Do NOT include any conversational preamble, greetings, or postscript.
2. Automatic Translation (CRITICAL):
   - Every question and option MUST be provided in BOTH English and Hindi.
   - If the image contains Hindi only: You MUST automatically translate the question and all options into clear, accurate English for "question_english" and "option_text_english".
   - If the image contains English only: You MUST automatically translate the question and all options into natural, standard Hindi for "question_hindi" and "option_text_hindi".
   - If the image has both languages, transcribe both faithfully.
   - Numbers & Formula Options: For numbers, math formulas, equations, or universal values (e.g. "50", "59", "25%", "RAM"), put the exact value in BOTH English and Hindi fields. Do NOT put "N/A" for numbers or simple terms!
   - Fallback to "N/A": ONLY if you genuinely fail to translate, the text is completely illegible/cut off, or due to any specific reason translation is impossible, set that specific field to "N/A".
3. Options Array:
   - Each option MUST be an object with:
     - "option_label": "a", "b", "c", "d" (or "e" if 5 options).
     - "option_text_english": English text of the option (automatically translated if image was Hindi, or same value if number/formula).
     - "option_text_hindi": Hindi text of the option (automatically translated if image was English, or same value if number/formula).
4. Correct Answer & Step-by-Step Indented Explanation:
   - "correct_option_label": Lowercase letter ("a", "b", "c", or "d") of the correct answer. If marked in the image, transcribe it; otherwise solve the question accurately.
   - "explanation_english" & "explanation_hindi":
     - CRITICAL: NEVER write explanations or calculations as one continuous sentence. Single-line explanations cause confusion.
     - Break every calculation step, formula, and conclusion into SEPARATE lines using newline characters ("\\n").
     - Format each line with bullet points ("• ") or step numbers for clean indentation and readability.
     - Example format:
       "• Total distance = (2 * 60) + 80 = 120 + 80 = 200 km\\n• Total time = 2 + (80 / 40) = 2 + 2 = 4 hours\\n• Average speed = Total distance / Total time = 200 / 4 = 50 km/h"
5. Numbering & Header:
   - "question_number": Consecutive integer starting from 1 (or the question number printed in the image).
   - "title": A descriptive title for this exam set based on the paper (e.g. "Railway ALP CBT-1 Mock Test").
   - "durationMinutes": Time in minutes (e.g. 60).

### TARGET JSON SCHEMA:
{
  "title": "Practice Mock Test from Image",
  "durationMinutes": 60,
  "questions": [
    {
      "question_number": 1,
      "question_english": "Rachin travels a distance for 2 hours at a speed of 60 km/h and an 80 km distance at a speed of 40 km/h. Find Rachin's average speed (in km/h).",
      "question_hindi": "रचिन एक दूरी 2 घंटे तक 60 किमी०/घंटे की चाल से और 80 किमी० की दूरी 40 किमी०/घंटे की चाल से तय करता है। रचिन की औसत चाल (किमी०/घंटे में) ज्ञात कीजिए।",
      "options": [
        { "option_label": "a", "option_text_english": "50", "option_text_hindi": "50" },
        { "option_label": "b", "option_text_english": "59", "option_text_hindi": "59" },
        { "option_label": "c", "option_text_english": "55", "option_text_hindi": "55" },
        { "option_label": "d", "option_text_english": "47", "option_text_hindi": "47" }
      ],
      "correct_option_label": "a",
      "explanation_english": "• Total distance = (2 * 60) + 80 = 120 + 80 = 200 km\\n• Total time = 2 + (80 / 40) = 2 + 2 = 4 hours\\n• Average speed = Total distance / Total time = 200 / 4 = 50 km/h",
      "explanation_hindi": "• कुल दूरी = (2 * 60) + 80 = 120 + 80 = 200 किमी\\n• कुल समय = 2 + (80 / 40) = 2 + 2 = 4 घंटे\\n• औसत चाल = कुल दूरी / कुल समय = 200 / 4 = 50 किमी/घंटा"
    }
  ]
}`;

const ImportExam = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const { addExam } = useExam();
  const navigate = useNavigate();
  const redirectTimer = useRef(null);

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowPromptModal(false);
    };
    if (showPromptModal) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showPromptModal]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_IMAGE_OCR_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback in case clipboard API is restricted
      const textarea = document.createElement('textarea');
      textarea.value = AI_IMAGE_OCR_PROMPT;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

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

  const loadSample = () => {
    setJsonInput(JSON.stringify({
      title: "Sample Bilingual Mock Test",
      durationMinutes: 60,
      questions: [
        {
          question_number: 1,
          question_english: "Rachin travels a distance for 2 hours at a speed of 60 km/h and an 80 km distance at a speed of 40 km/h. Find Rachin's average speed (in km/h).",
          question_hindi: "रचिन एक दूरी 2 घंटे तक 60 किमी०/घंटे की चाल से और 80 किमी० की दूरी 40 किमी०/घंटे की चाल से तय करता है। रचिन की औसत चाल (किमी०/घंटे में) ज्ञात कीजिए।",
          options: [
            { option_label: "a", option_text_english: "50", option_text_hindi: "50" },
            { option_label: "b", option_text_english: "59", option_text_hindi: "59" },
            { option_label: "c", option_text_english: "55", option_text_hindi: "55" },
            { option_label: "d", option_text_english: "47", option_text_hindi: "47" }
          ],
          correct_option_label: "a",
          explanation_english: "• Total distance = (2 * 60) + 80 = 120 + 80 = 200 km\n• Total time = 2 + (80 / 40) = 2 + 2 = 4 hours\n• Average speed = Total distance / Total time = 200 / 4 = 50 km/h",
          explanation_hindi: "• कुल दूरी = (2 * 60) + 80 = 120 + 80 = 200 किमी\n• कुल समय = 2 + (80 / 40) = 2 + 2 = 4 घंटे\n• औसत चाल = कुल दूरी / कुल समय = 200 / 4 = 50 किमी/घंटा"
        },
        {
          question_number: 2,
          question_english: "Which computer memory is volatile and loses contents when powered off?",
          question_hindi: "कौन सी कंप्यूटर मेमोरी अस्थिर (Volatile) होती है और बिजली बंद होने पर डेटा खो देती है?",
          options: [
            { option_label: "a", option_text_english: "ROM", option_text_hindi: "रॉम (ROM)" },
            { option_label: "b", option_text_english: "RAM", option_text_hindi: "रैम (RAM)" },
            { option_label: "c", option_text_english: "Hard Disk", option_text_hindi: "हार्ड डिस्क" },
            { option_label: "d", option_text_english: "Flash Memory", option_text_hindi: "फ्लैश मेमोरी" }
          ],
          correct_option_label: "b",
          explanation_english: "RAM (Random Access Memory) is volatile and requires continuous power.",
          explanation_hindi: "रैम (RAM) एक अस्थिर मेमोरी है जिसे डेटा बनाए रखने के लिए बिजली की आवश्यकता होती है।"
        },
        {
          question_number: 2,
          question_english: "N/A",
          question_hindi: "भारतीय संविधान की प्रारूप समिति (Drafting Committee) के अध्यक्ष कौन थे?",
          options: [
            { option_label: "a", option_text_english: "N/A", option_text_hindi: "डॉ. राजेन्द्र प्रसाद" },
            { option_label: "b", option_text_english: "N/A", option_text_hindi: "डॉ. बी. आर. अम्बेडकर" },
            { option_label: "c", option_text_english: "N/A", option_text_hindi: "जवाहरलाल नेहरू" },
            { option_label: "d", option_text_english: "N/A", option_text_hindi: "सरदार वल्लभभाई पटेल" }
          ],
          correct_option_label: "b",
          explanation_english: "N/A",
          explanation_hindi: "संविधान सभा की प्रारूप समिति के अध्यक्ष डॉ. भीमराव रामजी अम्बेडकर थे।"
        },
        {
          question_number: 3,
          question_english: "Which protocol is used for secure communication over the web?",
          question_hindi: "N/A",
          options: [
            { option_label: "a", option_text_english: "HTTP", option_text_hindi: "N/A" },
            { option_label: "b", option_text_english: "FTP", option_text_hindi: "N/A" },
            { option_label: "c", option_text_english: "HTTPS", option_text_hindi: "N/A" },
            { option_label: "d", option_text_english: "SMTP", option_text_hindi: "N/A" }
          ],
          correct_option_label: "c",
          explanation_english: "HTTPS encrypts normal HTTP traffic using SSL/TLS encryption.",
          explanation_hindi: "N/A"
        }
      ]
    }, null, 2));
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
            <label htmlFor="exam-json">Exam JSON (Bilingual Hindi + English Format)</label>
            <div className="sample-buttons">
              <button
                type="button"
                className="btn-sample"
                onClick={loadSample}
              >
                Load Bilingual Sample (Hindi + English)
              </button>
              <button
                type="button"
                className="btn-sample btn-sample-prompt"
                onClick={() => setShowPromptModal(true)}
                title="View prompt to convert question photos to JSON with AI"
              >
                <Camera size={14} />
                <span>AI Prompt for Question Photos</span>
              </button>
              <button
                type="button"
                className={`btn-sample btn-sample-copy ${copied ? 'copied-btn' : ''}`}
                onClick={handleCopyPrompt}
                title="Copy prompt to clipboard"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Prompt Copied!' : 'Copy Prompt'}</span>
              </button>
            </div>
          </div>
          <p className="import-help">
            Only bilingual (Hindi + English) format is accepted. Use the <strong>AI Prompt for Question Photos</strong> to digitize questions from camera photos — the AI will automatically generate translations so both languages are populated (or set to <code>"N/A"</code> only if translation is impossible).
          </p>
          <textarea
            id="exam-json"
            spellCheck={false}
            aria-describedby={error ? "import-error" : undefined}
            aria-invalid={Boolean(error)}
            className="json-textarea"
            placeholder={`{\n  "title": "Bilingual Practice Exam",\n  "durationMinutes": 60,\n  "questions": [\n    {\n      "question_number": 1,\n      "question_english": "Question text in English (or N/A)",\n      "question_hindi": "हिंदी में प्रश्न (या N/A)",\n      "options": [\n        { "option_label": "a", "option_text_english": "English option (or N/A)", "option_text_hindi": "हिंदी विकल्प (या N/A)" }\n      ],\n      "correct_option_label": "a",\n      "explanation_english": "English explanation (or N/A)",\n      "explanation_hindi": "हिंदी व्याख्या (या N/A)"\n    }\n  ]\n}`}
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

      {/* AI Prompt Modal */}
      {showPromptModal && (
        <div className="prompt-modal-overlay" onClick={() => setShowPromptModal(false)}>
          <div className="prompt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="prompt-modal-header">
              <div>
                <h3>
                  <Camera size={20} className="icon-gold" />
                  <span>AI Prompt for Question Photos</span>
                </h3>
                <p>Use this prompt in ChatGPT, Claude, or Gemini along with question photos. AI will transcribe and automatically generate missing English/Hindi translations.</p>
              </div>
              <button 
                type="button" 
                className="btn-close-modal" 
                onClick={() => setShowPromptModal(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="prompt-modal-body">
              <div className="prompt-steps-grid">
                <div className="prompt-step-box">
                  <span className="step-num">Step 1</span>
                  <span className="step-text">Click "Copy AI Prompt" below</span>
                </div>
                <div className="prompt-step-box">
                  <span className="step-num">Step 2</span>
                  <span className="step-text">Open ChatGPT / Gemini, attach your photo &amp; paste this prompt</span>
                </div>
                <div className="prompt-step-box">
                  <span className="step-num">Step 3</span>
                  <span className="step-text">Copy the generated JSON and paste it into the Exam JSON box</span>
                </div>
              </div>

              <div className="prompt-code-container">
                <pre className="prompt-code-text">{AI_IMAGE_OCR_PROMPT}</pre>
              </div>
            </div>

            <div className="prompt-modal-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowPromptModal(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className={`btn-copy-prompt ${copied ? 'copied' : ''}`}
                onClick={handleCopyPrompt}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy AI Prompt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportExam;
