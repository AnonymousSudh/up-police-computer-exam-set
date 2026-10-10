import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { Award, CheckCircle, XCircle, AlertCircle, Filter, Languages } from 'lucide-react';
import { QuestionReferences } from '../components/QuestionReferences';
import { AdBanner } from '../components/AdBanner';
import { isBilingualQuestion, getQuestionText, getQuestionOptions, getQuestionExplanation } from '../lib/exam';

const Result = () => {
  const { currentExamResult, storageWarning } = useExam();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [globalReviewLang, setGlobalReviewLang] = useState('en');
  const [questionReviewLangs, setQuestionReviewLangs] = useState({});

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
  const hasAnyBilingual = exam?.questions?.some(isBilingualQuestion);

  return (
    <div className="result-container">
      <div className="result-card">
        {storageWarning && <p role="status" className="alert error-alert">{storageWarning}</p>}
        <div className="result-header">
          <Award size={48} className="award-icon" />
          <h2>Exam Result</h2>
          <p className="exam-title-text">{examTitle}</p>
        </div>

        <div className="score-circle-container">
          <div className="score-circle" style={{ background: `conic-gradient(var(--accent-primary) ${percentage}%, var(--border-color) 0)` }}>
            <span className="score-text">{percentage}%</span>
            <span className="score-subtext">Score</span>
          </div>
        </div>

        <div className="stats-grid">
          <button
            type="button"
            className={`stat-box clickable-card ${filter === 'all' ? 'active-filter' : ''}`}
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            <span className="stat-label">Total Questions</span>
            <span className="stat-value">{totalQuestions}</span>
          </button>
          <button
            type="button"
            className={`stat-box success-box clickable-card ${filter === 'correct' ? 'active-filter-success' : ''}`}
            aria-pressed={filter === 'correct'}
            onClick={() => handleFilterClick('correct')}
          >
            <CheckCircle size={20} />
            <div className="stat-info">
              <span className="stat-label">Correct</span>
              <span className="stat-value">{correctCount}</span>
            </div>
          </button>
          <button
            type="button"
            className={`stat-box danger-box clickable-card ${filter === 'incorrect' ? 'active-filter-danger' : ''}`}
            aria-pressed={filter === 'incorrect'}
            onClick={() => handleFilterClick('incorrect')}
          >
            <XCircle size={20} />
            <div className="stat-info">
              <span className="stat-label">Incorrect</span>
              <span className="stat-value">{incorrectCount}</span>
            </div>
          </button>
          <button
            type="button"
            className={`stat-box warning-box clickable-card ${filter === 'unattempted' ? 'active-filter-warning' : ''}`}
            aria-pressed={filter === 'unattempted'}
            onClick={() => handleFilterClick('unattempted')}
          >
            <AlertCircle size={20} />
            <div className="stat-info">
              <span className="stat-label">Unattempted</span>
              <span className="stat-value">{unattemptedCount}</span>
            </div>
          </button>
        </div>

        <AdBanner dataAdSlot="RESULT_PAGE_MID_SLOT" className="hide-on-large" />

        {exam && (
          <div className="detailed-review">
            <div className="review-header-row">
              <div className="review-header-title-group">
                <h3 className="review-title">Detailed Review</h3>
                {filter !== 'all' && (
                  <div className="filter-status-tag">
                    <Filter size={15} /> 
                    <span>Showing {filter} ({
                      filter === 'correct' ? correctCount : 
                      filter === 'incorrect' ? incorrectCount : unattemptedCount
                    })</span>
                  </div>
                )}
              </div>
              {hasAnyBilingual && (
                <div className="header-lang-switcher" role="group" aria-label="Review language">
                  <Languages size={15} className="lang-icon" aria-hidden="true" />
                  <span className="lang-text-label">Review in:</span>
                  <div className="lang-pills">
                    <button
                      type="button"
                      className={`lang-pill ${globalReviewLang === 'en' ? 'active' : ''}`}
                      onClick={() => setGlobalReviewLang('en')}
                      aria-pressed={globalReviewLang === 'en'}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      className={`lang-pill ${globalReviewLang === 'hi' ? 'active' : ''}`}
                      onClick={() => setGlobalReviewLang('hi')}
                      aria-pressed={globalReviewLang === 'hi'}
                    >
                      हिन्दी
                    </button>
                  </div>
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
                const isBilingual = isBilingualQuestion(q);
                const currentLang = questionReviewLangs[q.id] || globalReviewLang;
                const displayText = getQuestionText(q, currentLang);
                const displayOptions = getQuestionOptions(q, currentLang);
                const displayExplanation = getQuestionExplanation(q, currentLang);
                
                return (
                  <div key={q.id} className={`review-card ${isCorrect ? 'correct-card' : isAttempted ? 'incorrect-card' : 'unattempted-card'}`}>
                    <div className="review-q-header">
                      <div className="review-q-header-left">
                        <span className="q-num">Question {idx + 1}</span>
                        {isBilingual && (
                          <div className="question-lang-switcher compact" role="group" aria-label="Question language toggle">
                            <Languages size={13} aria-hidden="true" />
                            <div className="lang-pills">
                              <button
                                type="button"
                                className={`lang-pill ${currentLang === 'en' ? 'active' : ''}`}
                                onClick={() => setQuestionReviewLangs(prev => ({ ...prev, [q.id]: 'en' }))}
                                aria-pressed={currentLang === 'en'}
                              >
                                English
                              </button>
                              <button
                                type="button"
                                className={`lang-pill ${currentLang === 'hi' ? 'active' : ''}`}
                                onClick={() => setQuestionReviewLangs(prev => ({ ...prev, [q.id]: 'hi' }))}
                                aria-pressed={currentLang === 'hi'}
                              >
                                हिन्दी
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className={`q-status ${isCorrect ? 'text-success' : isAttempted ? 'text-danger' : 'text-warning'}`}>
                        {isCorrect ? 'Correct' : isAttempted ? 'Incorrect' : 'Unattempted'}
                      </span>
                    </div>
                    <h4 className="review-q-text">{displayText}</h4>
                    
                    <div className="review-options">
                      {displayOptions.map((opt, optIdx) => {
                        const label = q.option_labels?.[optIdx] || String.fromCharCode(65 + optIdx);
                        let optClass = 'review-opt';
                        if (optIdx === q.correctAnswer) {
                          optClass += ' correct-opt';
                        } else if (optIdx === userAnswer) {
                          optClass += ' incorrect-opt';
                        }
                        
                        return (
                          <div key={optIdx} className={optClass}>
                            <div className="opt-content">
                              <span className="opt-marker">{label.toUpperCase()}.</span> 
                              <span>{opt}</span>
                            </div>
                            {optIdx === q.correctAnswer && <CheckCircle size={18} className="opt-icon success-icon" />}
                            {optIdx === userAnswer && optIdx !== q.correctAnswer && <XCircle size={18} className="opt-icon danger-icon" />}
                          </div>
                        );
                      })}
                    </div>
                    
                    <QuestionReferences examId={exam.id} questionId={q.id} />
                    {displayExplanation && (
                      <div className="explanation-box">
                        <strong>Explanation:</strong> {displayExplanation}
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
