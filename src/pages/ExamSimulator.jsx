import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { gradeExam, readStorage, writeStorage, sessionStore, isBilingualQuestion, getQuestionText, getQuestionOptions, formatTimer } from '../lib/exam';
import { Timer, Clock, ArrowLeft, ArrowRight, Flag, CheckCircle, Languages } from 'lucide-react';

const ExamSimulator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getExamById, saveExamResult } = useExam();
  
  const exam = getExamById(id);
  const storageKey = `up-police-attempt-${id}`;
  const [initial] = useState(() => {
    const saved = readStorage(storageKey, null, sessionStore);
    if (exam && saved?.examSignature === JSON.stringify(exam) && Number.isFinite(saved.deadline) && saved.answers && typeof saved.answers === 'object' && !Array.isArray(saved.answers) && Object.entries(saved.answers).every(([questionId, answer]) => exam.questions.some(q => q.id === questionId && Number.isInteger(answer) && answer >= 0 && answer < q.options.length)) && saved.markedForReview && typeof saved.markedForReview === 'object' && Number.isInteger(saved.currentQuestionIdx) && saved.currentQuestionIdx >= 0 && saved.currentQuestionIdx < exam.questions.length) {
      const questionTimes = (saved.questionTimes && typeof saved.questionTimes === 'object' && !Array.isArray(saved.questionTimes)) ? saved.questionTimes : {};
      const totalTimeSpent = Number.isFinite(saved.totalTimeSpent) && saved.totalTimeSpent >= 0 ? saved.totalTimeSpent : 0;
      return { ...saved, questionTimes, totalTimeSpent };
    }
    return { answers: {}, markedForReview: {}, currentQuestionIdx: 0, deadline: Date.now() + (exam?.durationMinutes ?? 60) * 60000, questionTimes: {}, totalTimeSpent: 0 };
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
  const [questionTimes, setQuestionTimes] = useState(initial.questionTimes || {});
  const [totalTimeSpent, setTotalTimeSpent] = useState(initial.totalTimeSpent || 0);

  const questionTimesRef = useRef(initial.questionTimes || {});
  const totalTimeSpentRef = useRef(initial.totalTimeSpent || 0);
  const currentQuestionIdxRef = useRef(initial.currentQuestionIdx);
  const lastTickRef = useRef(0);
  const submitted = useRef(false);
  const questionArea = useRef(null);

  useEffect(() => {
    currentQuestionIdxRef.current = currentQuestionIdx;
  }, [currentQuestionIdx]);

  const handleSubmit = useCallback((automatic = false) => {
    if (!exam || submitted.current) return;
    if (!automatic && !window.confirm(`Submit this exam? ${exam.questions.length - Object.keys(answers).length} question(s) are unanswered.`)) return;
    submitted.current = true;

    // Flush any pending seconds on current question
    const now = Date.now();
    const elapsed = lastTickRef.current ? Math.max(0, Math.round((now - lastTickRef.current) / 1000)) : 0;
    if (elapsed > 0) {
      totalTimeSpentRef.current += elapsed;
      const currentQ = exam.questions[currentQuestionIdxRef.current];
      if (currentQ?.id) {
        questionTimesRef.current = {
          ...questionTimesRef.current,
          [currentQ.id]: (questionTimesRef.current[currentQ.id] || 0) + elapsed
        };
      }
    }

    saveExamResult(gradeExam(exam, answers, questionTimesRef.current, totalTimeSpentRef.current));
    try { sessionStore.removeItem(storageKey); } catch { /* Storage may be disabled. */ }
    navigate('/result', { replace: true });
  }, [exam, answers, saveExamResult, storageKey, navigate]);

  useEffect(() => {
    if (!exam) navigate('/', { replace: true });
  }, [exam, navigate]);

  useEffect(() => {
    lastTickRef.current = Date.now();
    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
      setTimeLeft(remaining);

      const elapsed = Math.max(0, Math.round((now - lastTickRef.current) / 1000));
      if (elapsed > 0) {
        lastTickRef.current = now;
        totalTimeSpentRef.current += elapsed;
        const currentQ = exam?.questions?.[currentQuestionIdxRef.current];
        if (currentQ?.id) {
          questionTimesRef.current = {
            ...questionTimesRef.current,
            [currentQ.id]: (questionTimesRef.current[currentQ.id] || 0) + elapsed
          };
        }
        setTotalTimeSpent(totalTimeSpentRef.current);
        setQuestionTimes({ ...questionTimesRef.current });
      }

      if (remaining === 0) handleSubmit(true);
    };
    tick();
    const timerId = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timerId); document.removeEventListener('visibilitychange', tick); };
  }, [deadline, exam, handleSubmit]);

  useEffect(() => {
    if (!exam || submitted.current) return;
    const saved = writeStorage(
      storageKey,
      {
        examSignature: JSON.stringify(exam),
        answers,
        markedForReview,
        currentQuestionIdx,
        deadline,
        questionTimes,
        totalTimeSpent
      },
      sessionStore
    );
    setStorageFailed(!saved);
  }, [exam, storageKey, answers, markedForReview, currentQuestionIdx, deadline, questionTimes, totalTimeSpent]);

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

  const navigateToQuestion = (targetIdx) => {
    if (targetIdx === currentQuestionIdx) return;
    const now = Date.now();
    const elapsed = lastTickRef.current ? Math.max(0, Math.round((now - lastTickRef.current) / 1000)) : 0;
    if (elapsed > 0) {
      lastTickRef.current = now;
      totalTimeSpentRef.current += elapsed;
      const currentQ = exam?.questions?.[currentQuestionIdxRef.current];
      if (currentQ?.id) {
        questionTimesRef.current = {
          ...questionTimesRef.current,
          [currentQ.id]: (questionTimesRef.current[currentQ.id] || 0) + elapsed
        };
      }
      setTotalTimeSpent(totalTimeSpentRef.current);
      setQuestionTimes({ ...questionTimesRef.current });
    } else {
      lastTickRef.current = now;
    }
    setCurrentQuestionIdx(targetIdx);
  };

  const handleOptionSelect = optionIdx => setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIdx }));
  const toggleMarkForReview = () => setMarkedForReview(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }));
  const handleNext = () => navigateToQuestion(Math.min(currentQuestionIdx + 1, exam.questions.length - 1));
  const handlePrev = () => navigateToQuestion(Math.max(0, currentQuestionIdx - 1));

  const handleTimeClick = () => {
    setIsEditingTime(true);
    setEditTimeValue(formatTimer(timeLeft));
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
              <button className="timer-edit" aria-label={`Time remaining ${formatTimer(timeLeft)}. Adjust practice timer`} onClick={handleTimeClick}>{formatTimer(timeLeft)}</button>
            )}
          </div>
        </div>

        {timeError && <p role="alert" className="alert error-alert">{timeError}</p>}
        {storageFailed && <p role="status" className="alert error-alert">Browser storage is unavailable. Keep this tab open to retain your answers.</p>}
        <div className="question-area" ref={questionArea}>
          <div className="question-top-bar">
            <div className="question-top-left">
              <div className="question-number">Question {currentQuestionIdx + 1} of {exam.questions.length}</div>
              <div className="question-time-badge" title="Time spent on this question">
                <Clock size={14} className="question-time-icon" aria-hidden="true" />
                <span>Time on Q: <strong>{formatTimer(questionTimes[currentQuestion.id] || 0)}</strong></span>
              </div>
            </div>
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
                onClick={() => navigateToQuestion(idx)}
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
