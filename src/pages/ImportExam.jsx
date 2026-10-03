import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

const ImportExam = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { addExam } = useExam();
  const navigate = useNavigate();

  const handleImport = () => {
    setError('');
    setSuccess('');
    
    try {
      if (!jsonInput.trim()) {
        throw new Error('Please enter JSON text.');
      }
      const parsedData = JSON.parse(jsonInput);
      
      // Basic Validation
      if (!parsedData.title || !parsedData.questions || !Array.isArray(parsedData.questions)) {
        throw new Error('Invalid format. JSON must include title and a questions array.');
      }

      // Format data to fit app structure gracefully handling missing fields
      const formattedData = {
        id: parsedData.id || `custom-${Date.now()}`,
        title: parsedData.title,
        durationMinutes: parsedData.durationMinutes || 60,
        questions: parsedData.questions.map((q, idx) => ({
          ...q,
          id: q.id ? String(q.id) : `q-${idx}`,
          text: q.text || q.question
        }))
      };
      
      addExam(formattedData);
      setSuccess('Exam imported successfully! Redirecting to home...');
      setJsonInput('');
      
      setTimeout(() => {
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
          <textarea
            className="json-textarea"
            placeholder={`{\n  "id": "custom-1",\n  "title": "My Custom Exam",\n  "durationMinutes": 60,\n  "questions": [...]\n}`}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          ></textarea>

          {error && (
            <div className="alert error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="alert success-alert">
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}
        </div>

        <div className="import-footer">
          <button className="btn-secondary" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleImport}>
            Parse & Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExam;
