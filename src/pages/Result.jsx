import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { Award, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';

const Result = () => {
  const { currentExamResult } = useExam();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  if (!currentExamResult) {
    return (
      <div className="result-container error-state">
        <p>No result found. Please take an exam first.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Return Home</button>
      </div>
    );
  }

  const handleFilterClick = (newFilter) => {
    setFilter(prev => prev === newFilter ? 'all' : newFilter);
  };

  const { examTitle, totalQuestions, score, correctCount, incorrectCount, unattemptedCount, answers, exam } = currentExamResult;
  const percentage = Math.round((score / totalQuestions) * 100) || 0;

  return (
    <div className="result-container">
      <div className="result-card">
        <div className="result-header">
          <Award size={48} className="award-icon" />
          <h2>Exam Result</h2>
          <p className="exam-title-text">{examTitle}</p>
        </div>

        <div className="score-circle-container">
          <div className="score-circle">
            <span className="score-text">{percentage}%</span>
            <span className="score-subtext">Score</span>
          </div>
        </div>

        <div className="stats-grid">
          <div 
            className={`stat-box clickable-card ${filter === 'all' ? 'active-filter' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span className="stat-label">Total Questions</span>
            <span className="stat-value">{totalQuestions}</span>
          </div>
          <div 
            className={`stat-box success-box clickable-card ${filter === 'correct' ? 'active-filter-success' : ''}`}
            onClick={() => handleFilterClick('correct')}
          >
            <CheckCircle size={20} />
            <div className="stat-info">
              <span className="stat-label">Correct</span>
              <span className="stat-value">{correctCount}</span>
            </div>
          </div>
          <div 
            className={`stat-box danger-box clickable-card ${filter === 'incorrect' ? 'active-filter-danger' : ''}`}
            onClick={() => handleFilterClick('incorrect')}
          >
            <XCircle size={20} />
            <div className="stat-info">
              <span className="stat-label">Incorrect</span>
              <span className="stat-value">{incorrectCount}</span>
            </div>
          </div>
          <div 
            className={`stat-box warning-box clickable-card ${filter === 'unattempted' ? 'active-filter-warning' : ''}`}
            onClick={() => handleFilterClick('unattempted')}
          >
            <AlertCircle size={20} />
            <div className="stat-info">
              <span className="stat-label">Unattempted</span>
              <span className="stat-value">{unattemptedCount}</span>
            </div>
          </div>
        </div>

        {exam && (
          <div className="detailed-review">
            <div className="review-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 className="review-title" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>Detailed Review</h3>
              {filter !== 'all' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 500 }}>
                  <Filter size={16} /> 
                  <span>Showing {filter} ({
                    filter === 'correct' ? correctCount : 
                    filter === 'incorrect' ? incorrectCount : unattemptedCount
                  })</span>
                </div>
              )}
            </div>
            
            <div className="review-list">
              {exam.questions.map((q, idx) => ({ ...q, originalIdx: idx })).filter(q => {
                const userAnswer = answers[q.id];
                const isCorrect = userAnswer === q.correctAnswer;
                const isAttempted = userAnswer !== undefined;
                
                if (filter === 'all') return true;
                if (filter === 'correct') return isCorrect;
                if (filter === 'incorrect') return isAttempted && !isCorrect;
                if (filter === 'unattempted') return !isAttempted;
                return true;
              }).map((q) => {
                const idx = q.originalIdx;
                const userAnswer = answers[q.id];
                const isCorrect = userAnswer === q.correctAnswer;
                const isAttempted = userAnswer !== undefined;
                
                return (
                  <div key={q.id} className={`review-card ${isCorrect ? 'correct-card' : isAttempted ? 'incorrect-card' : 'unattempted-card'}`}>
                    <div className="review-q-header">
                      <span className="q-num">Question {idx + 1}</span>
                      <span className={`q-status ${isCorrect ? 'text-success' : isAttempted ? 'text-danger' : 'text-warning'}`}>
                        {isCorrect ? 'Correct' : isAttempted ? 'Incorrect' : 'Unattempted'}
                      </span>
                    </div>
                    <h4 className="review-q-text">{q.text}</h4>
                    
                    <div className="review-options">
                      {q.options.map((opt, optIdx) => {
                        let optClass = 'review-opt';
                        if (optIdx === q.correctAnswer) {
                          optClass += ' correct-opt';
                        } else if (optIdx === userAnswer) {
                          optClass += ' incorrect-opt';
                        }
                        
                        return (
                          <div key={optIdx} className={optClass}>
                            <div className="opt-content">
                              <span className="opt-marker">{String.fromCharCode(65 + optIdx)}.</span> 
                              <span>{opt}</span>
                            </div>
                            {optIdx === q.correctAnswer && <CheckCircle size={18} className="opt-icon success-icon" />}
                            {optIdx === userAnswer && optIdx !== q.correctAnswer && <XCircle size={18} className="opt-icon danger-icon" />}
                          </div>
                        );
                      })}
                    </div>
                    
                    {q.explanation && (
                      <div className="explanation-box">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="result-footer">
          <button className="btn-primary" onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Result;
