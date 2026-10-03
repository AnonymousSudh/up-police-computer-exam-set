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
          <label htmlFor="exam-json">Exam JSON</label>
          <p className="import-help">Use 2–8 text options per question and a zero-based correctAnswer (0 = first option). Exams are saved only in this browser.</p>
          <textarea
            id="exam-json"
            spellCheck={false}
            aria-describedby={error ? "import-error" : undefined}
            aria-invalid={Boolean(error)}
            className="json-textarea"
            placeholder={`{\n  "id": "custom-1",\n  "title": "My Custom Exam",\n  "durationMinutes": 60,\n  "questions": [...]\n}`}
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
