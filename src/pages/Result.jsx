import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { Award, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Result = () => {
  const { currentExamResult } = useExam();
  const navigate = useNavigate();

  if (!currentExamResult) {
    return (
      <div className="result-container error-state">
        <p>No result found. Please take an exam first.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Return Home</button>
      </div>
    );
  }

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
          <div className="stat-box">
            <span className="stat-label">Total Questions</span>
            <span className="stat-value">{totalQuestions}</span>
          </div>
          <div className="stat-box success-box">
            <CheckCircle size={20} />
            <div className="stat-info">
              <span className="stat-label">Correct</span>
              <span className="stat-value">{correctCount}</span>
            </div>
          </div>
          <div className="stat-box danger-box">
            <XCircle size={20} />
            <div className="stat-info">
              <span className="stat-label">Incorrect</span>
              <span className="stat-value">{incorrectCount}</span>
            </div>
          </div>
          <div className="stat-box warning-box">
            <AlertCircle size={20} />
            <div className="stat-info">
              <span className="stat-label">Unattempted</span>
              <span className="stat-value">{unattemptedCount}</span>
            </div>
          </div>
        </div>

        {exam && (
          <div className="detailed-review">
            <h3 className="review-title">Detailed Review</h3>
            <div className="review-list">
              {exam.questions.map((q, idx) => {
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
