import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { Timer, ArrowLeft, ArrowRight, Flag, CheckCircle } from 'lucide-react';

const ExamSimulator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getExamById, saveExamResult } = useExam();
  
  const [exam, setExam] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editTimeValue, setEditTimeValue] = useState('');
  
  useEffect(() => {
    const loadedExam = getExamById(id);
    if (!loadedExam) {
      navigate('/');
      return;
    }
    setExam(loadedExam);
    setTimeLeft(loadedExam.durationMinutes * 60);
  }, [id, getExamById, navigate]);

  useEffect(() => {
    if (timeLeft <= 0 && exam) {
      handleSubmit();
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, exam]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (exam && currentQuestionIdx < exam.questions.length - 1) {
          setCurrentQuestionIdx(prev => prev + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIdx, exam]);

  if (!exam) return <div className="loading">Loading Exam...</div>;

  const currentQuestion = exam.questions[currentQuestionIdx];

  const handleOptionSelect = (optionIdx) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIdx }));
  };

  const toggleMarkForReview = () => {
    setMarkedForReview(prev => ({ 
      ...prev, 
      [currentQuestion.id]: !prev[currentQuestion.id] 
    }));
  };

  const handleNext = () => {
    if (currentQuestionIdx < exam.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    exam.questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer === undefined) {
        unattemptedCount++;
      } else if (userAnswer === q.correctAnswer) {
        score += 1;
        correctCount++;
      } else {
        // Optional negative marking could be added here
        incorrectCount++;
      }
    });

    const result = {
      examTitle: exam.title,
      totalQuestions: exam.questions.length,
      score,
      correctCount,
      incorrectCount,
      unattemptedCount,
      answers,
      exam
    };
    
    saveExamResult(result);
    navigate('/result');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleTimeClick = () => {
    setIsEditingTime(true);
    setEditTimeValue(formatTime(timeLeft));
  };

  const handleTimeSubmit = () => {
    setIsEditingTime(false);
    const parts = editTimeValue.split(':');
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10);
      const s = parseInt(parts[1], 10);
      if (!isNaN(m) && !isNaN(s)) {
        setTimeLeft(m * 60 + s);
      }
    } else if (parts.length === 1) {
      const m = parseInt(parts[0], 10);
      if (!isNaN(m)) {
        setTimeLeft(m * 60);
      }
    }
  };

  const handleTimeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      handleTimeSubmit();
    }
  };

  return (
    <div className="exam-simulator-container">
      <div className="exam-main-panel">
        <div className="exam-header-bar">
          <h2 className="exam-title">{exam.title}</h2>
          <div className={`timer-badge ${timeLeft < 300 && !isEditingTime ? 'timer-warning' : ''}`} style={{cursor: 'pointer'}}>
            <Timer size={18} onClick={!isEditingTime ? handleTimeClick : undefined} />
            {isEditingTime ? (
              <input 
                type="text" 
                value={editTimeValue}
                onChange={(e) => setEditTimeValue(e.target.value)}
                onBlur={handleTimeSubmit}
                onKeyDown={handleTimeKeyDown}
                autoFocus
                style={{
                  width: '60px', 
                  background: 'transparent', 
                  border: '1px solid var(--accent-primary)',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  fontWeight: 'inherit',
                  textAlign: 'center',
                  outline: 'none',
                  borderRadius: '4px'
                }}
              />
            ) : (
              <span onClick={handleTimeClick}>{formatTime(timeLeft)}</span>
            )}
          </div>
        </div>

        <div className="question-area">
          <div className="question-number">Question {currentQuestionIdx + 1} of {exam.questions.length}</div>
          <h3 className="question-text">{currentQuestion.text}</h3>
          
          <div className="options-list">
            {currentQuestion.options.map((option, idx) => (
              <div 
                key={idx} 
                className={`option-item ${answers[currentQuestion.id] === idx ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(idx)}
              >
                <div className="option-radio">
                  {answers[currentQuestion.id] === idx && <div className="radio-dot"></div>}
                </div>
                <span>{option}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="exam-action-bar">
          <div className="left-actions">
            <button 
              className="btn-secondary" 
              onClick={handlePrev} 
              disabled={currentQuestionIdx === 0}
            >
              <ArrowLeft size={18} /> Previous
            </button>
            <button 
              className={`btn-outline ${markedForReview[currentQuestion.id] ? 'active-mark' : ''}`}
              onClick={toggleMarkForReview}
            >
              <Flag size={18} /> {markedForReview[currentQuestion.id] ? 'Unmark' : 'Mark for Review'}
            </button>
          </div>
          <div className="right-actions">
            {currentQuestionIdx < exam.questions.length - 1 ? (
              <button className="btn-primary" onClick={handleNext}>
                Next <ArrowRight size={18} />
              </button>
            ) : (
              <button className="btn-success" onClick={handleSubmit}>
                <CheckCircle size={18} /> Submit Exam
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="exam-side-panel">
        <div className="side-panel-header">
          <h3>Question Palette</h3>
        </div>
        <div className="palette-grid">
          {exam.questions.map((q, idx) => {
            let statusClass = 'unattempted';
            if (answers[q.id] !== undefined) statusClass = 'attempted';
            if (markedForReview[q.id]) statusClass += ' marked';

            return (
              <button 
                key={q.id}
                className={`palette-btn ${statusClass} ${currentQuestionIdx === idx ? 'current' : ''}`}
                onClick={() => setCurrentQuestionIdx(idx)}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
        
        <div className="palette-legend">
          <div className="legend-item">
            <span className="dot attempted"></span> 
            <span>Attempted: <strong>{Object.keys(answers).length}</strong></span>
          </div>
          <div className="legend-item">
            <span className="dot unattempted"></span> 
            <span>Unattempted: <strong>{exam.questions.length - Object.keys(answers).length}</strong></span>
          </div>
          <div className="legend-item">
            <span className="dot marked"></span> 
            <span>Marked for Review: <strong>{Object.values(markedForReview).filter(Boolean).length}</strong></span>
          </div>
        </div>
        
        <button className="btn-danger full-width mt-auto" onClick={handleSubmit}>
          Finish Test
        </button>
      </div>
    </div>
  );
};

export default ExamSimulator;
