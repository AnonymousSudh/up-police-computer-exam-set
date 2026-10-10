import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { gradeExam, readStorage, writeStorage, sessionStore, isBilingualQuestion, getQuestionText, getQuestionOptions } from '../lib/exam';
import { Timer, ArrowLeft, ArrowRight, Flag, CheckCircle, Languages } from 'lucide-react';

const ExamSimulator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getExamById, saveExamResult } = useExam();
  
  const exam = getExamById(id);
  const storageKey = `up-police-attempt-${id}`;
  const [initial] = useState(() => {
    const saved = readStorage(storageKey, null, sessionStore);
    if (exam && saved?.examSignature === JSON.stringify(exam) && Number.isFinite(saved.deadline) && saved.answers && typeof saved.answers === 'object' && !Array.isArray(saved.answers) && Object.entries(saved.answers).every(([questionId, answer]) => exam.questions.some(q => q.id === questionId && Number.isInteger(answer) && answer >= 0 && answer < q.options.length)) && saved.markedForReview && typeof saved.markedForReview === 'object' && Number.isInteger(saved.currentQuestionIdx) && saved.currentQuestionIdx >= 0 && saved.currentQuestionIdx < exam.questions.length) return saved;
    return { answers: {}, markedForReview: {}, currentQuestionIdx: 0, deadline: Date.now() + (exam?.durationMinutes ?? 60) * 60000 };
  });
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(initial.currentQuestionIdx);
  const [answers, setAnswers] = useState(initial.answers);
  const [markedForReview, setMarkedForReview] = useState(initial.markedForReview);
  const [deadline, setDeadline] = useState(initial.deadline);
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, Math.ceil((initial.deadline - Date.now()) / 1000)));
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editTimeValue, setEditTimeValue] = useState('');
  const [timeError, setTimeError] = useState('');
  const [storageFailed, setStorageFailed] = useState(false);
  const [globalLang, setGlobalLang] = useState('en');
  const [questionLangs, setQuestionLangs] = useState({});
  const submitted = useRef(false);
  const questionArea = useRef(null);

  const handleSubmit = useCallback((automatic = false) => {
    if (!exam || submitted.current) return;
    if (!automatic && !window.confirm(`Submit this exam? ${exam.questions.length - Object.keys(answers).length} question(s) are unanswered.`)) return;
    submitted.current = true;
    saveExamResult(gradeExam(exam, answers));
    try { sessionStore.removeItem(storageKey); } catch { /* Storage may be disabled. */ }
    navigate('/result', { replace: true });
  }, [exam, answers, saveExamResult, storageKey, navigate]);

  useEffect(() => {
    if (!exam) navigate('/', { replace: true });
  }, [exam, navigate]);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) handleSubmit(true);
    };
    tick();
    const timerId = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timerId); document.removeEventListener('visibilitychange', tick); };
  }, [deadline, handleSubmit]);

  useEffect(() => {
    if (!exam || submitted.current) return;
    const saved = writeStorage(storageKey, { examSignature: JSON.stringify(exam), answers, markedForReview, currentQuestionIdx, deadline }, sessionStore);
    setStorageFailed(!saved);
  }, [exam, storageKey, answers, markedForReview, currentQuestionIdx, deadline]);

  useEffect(() => {
    const warn = event => { if (submitted.current) return; event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  useEffect(() => { questionArea.current?.scrollTo(0, 0); }, [currentQuestionIdx]);

  if (!exam) return <div className="loading" role="status">Loading Exam...</div>;
  const currentQuestion = exam.questions[currentQuestionIdx];
  const hasAnyBilingual = exam.questions.some(isBilingualQuestion);
  const isCurrentBilingual = isBilingualQuestion(currentQuestion);
  const currentLang = questionLangs[currentQuestion.id] || globalLang;
  const displayText = getQuestionText(currentQuestion, currentLang);
  const displayOptions = getQuestionOptions(currentQuestion, currentLang);

  const handleOptionSelect = optionIdx => setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIdx }));
  const toggleMarkForReview = () => setMarkedForReview(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }));
  const handleNext = () => setCurrentQuestionIdx(prev => Math.min(prev + 1, exam.questions.length - 1));
  const handlePrev = () => setCurrentQuestionIdx(prev => Math.max(0, prev - 1));

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
    const match = /^(\d{1,4})(?::([0-5]\d))?$/.exec(editTimeValue.trim());
    const seconds = match ? Number(match[1]) * 60 + Number(match[2] ?? 0) : 0;
    if (seconds < 1 || seconds > 86400) {
      setTimeError('Enter minutes or MM:SS, between 00:01 and 1440:00.');
      return;
    }
    setDeadline(Date.now() + seconds * 1000);
    setTimeLeft(seconds);
    setTimeError('');
    setIsEditingTime(false);
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
          <div className="exam-header-left">
            <h2 className="exam-title">{exam.title}</h2>
            {hasAnyBilingual && (
              <div className="header-lang-switcher" role="group" aria-label="Default language">
                <Languages size={16} className="lang-icon" aria-hidden="true" />
                <span className="lang-text-label">Default:</span>
                <div className="lang-pills">
                  <button
                    type="button"
                    className={`lang-pill ${globalLang === 'en' ? 'active' : ''}`}
                    onClick={() => setGlobalLang('en')}
                    aria-pressed={globalLang === 'en'}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={`lang-pill ${globalLang === 'hi' ? 'active' : ''}`}
                    onClick={() => setGlobalLang('hi')}
                    aria-pressed={globalLang === 'hi'}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className={`timer-badge ${timeLeft < 300 && !isEditingTime ? 'timer-warning' : ''}`} >
            <Timer size={18} aria-hidden="true" />
            {isEditingTime ? (
              <input 
                type="text"
                aria-label="Practice timer in minutes or MM:SS"
                inputMode="numeric"
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
              <button className="timer-edit" aria-label={`Time remaining ${formatTime(timeLeft)}. Adjust practice timer`} onClick={handleTimeClick}>{formatTime(timeLeft)}</button>
            )}
          </div>
        </div>

        {timeError && <p role="alert" className="alert error-alert">{timeError}</p>}
        {storageFailed && <p role="status" className="alert error-alert">Browser storage is unavailable. Keep this tab open to retain your answers.</p>}
        <div className="question-area" ref={questionArea}>
          <div className="question-top-bar">
            <div className="question-number">Question {currentQuestionIdx + 1} of {exam.questions.length}</div>
            {isCurrentBilingual && (
              <div className="question-lang-switcher" role="group" aria-label="Question language toggle">
                <Languages size={15} aria-hidden="true" />
                <span className="lang-text-label">Language:</span>
                <div className="lang-pills">
                  <button
                    type="button"
                    className={`lang-pill ${currentLang === 'en' ? 'active' : ''}`}
                    onClick={() => setQuestionLangs(prev => ({ ...prev, [currentQuestion.id]: 'en' }))}
                    aria-pressed={currentLang === 'en'}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={`lang-pill ${currentLang === 'hi' ? 'active' : ''}`}
                    onClick={() => setQuestionLangs(prev => ({ ...prev, [currentQuestion.id]: 'hi' }))}
                    aria-pressed={currentLang === 'hi'}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>
            )}
          </div>
          {currentQuestion.topic && <p className="question-topic">{currentQuestion.topic}</p>}
          <h3 className="question-text">{displayText}</h3>
          
          <div className="options-list" role="group" aria-label="Answer options">
            {displayOptions.map((option, idx) => {
              const label = currentQuestion.option_labels?.[idx] || String.fromCharCode(65 + idx);
              return (
                <button
                  type="button"
                  aria-pressed={answers[currentQuestion.id] === idx}
                  key={idx} 
                  className={`option-item ${answers[currentQuestion.id] === idx ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(idx)}
                >
                  <div className="option-radio">
                    {answers[currentQuestion.id] === idx && <div className="radio-dot"></div>}
                  </div>
                  <span className="option-label-badge">{label.toUpperCase()}.</span>
                  <span className="option-label-text">{option}</span>
                </button>
              );
            })}
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
              aria-pressed={Boolean(markedForReview[currentQuestion.id])}
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
              <button className="btn-success" onClick={() => handleSubmit()}>
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
                aria-label={`Question ${idx + 1}, ${answers[q.id] !== undefined ? "answered" : "unanswered"}${markedForReview[q.id] ? ", marked for review" : ""}`}
                aria-current={currentQuestionIdx === idx ? "step" : undefined}
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
        
        <button className="btn-danger full-width mt-auto" onClick={() => handleSubmit()}>
          Finish Test
        </button>
      </div>
    </div>
  );
};

export default ExamSimulator;
