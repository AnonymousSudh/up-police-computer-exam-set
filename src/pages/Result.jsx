import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { Award, CheckCircle, XCircle, AlertCircle, Filter, Languages, Lightbulb, Clock, Zap, TrendingUp, ArrowUpDown } from 'lucide-react';
import { QuestionReferences } from '../components/QuestionReferences';
import { AdBanner } from '../components/AdBanner';
import { isBilingualQuestion, getQuestionText, getQuestionOptions, getQuestionExplanation, parseExplanationLines, formatDuration } from '../lib/exam';

const Result = () => {
  const { currentExamResult, storageWarning } = useExam();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('original');
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

  const {
    examTitle,
    totalQuestions,
    score,
    correctCount,
    incorrectCount,
    unattemptedCount,
    answers,
    exam,
    questionTimes = {},
    totalTimeSpent = 0
  } = currentExamResult;

  const percentage = Math.round((score / totalQuestions) * 100) || 0;
  const hasAnyBilingual = exam?.questions?.some(isBilingualQuestion);

  // Time metrics calculations
  const qTimes = questionTimes || {};
  const sumQTimes = Object.values(qTimes).reduce((acc, t) => acc + (Number(t) || 0), 0);
  const effectiveTotalTime = (Number.isFinite(totalTimeSpent) && totalTimeSpent > 0) ? totalTimeSpent : sumQTimes;
  const avgTimePerQuestion = totalQuestions > 0 ? Math.round(effectiveTotalTime / totalQuestions) : 0;

  let correctTime = 0;
  let incorrectTime = 0;
  let unattemptedTime = 0;
  let maxTime = -1;
  let minTime = Infinity;
  let maxTimeQ = null;
  let minTimeQ = null;

  if (exam?.questions) {
    exam.questions.forEach((q, idx) => {
      const t = qTimes[q.id] || 0;
      const ans = answers[q.id];
      if (ans === undefined) {
        unattemptedTime += t;
      } else if (ans === q.correctAnswer) {
        correctTime += t;
        if (t > maxTime) { maxTime = t; maxTimeQ = { q, idx, time: t }; }
        if (t < minTime && t > 0) { minTime = t; minTimeQ = { q, idx, time: t }; }
      } else {
        incorrectTime += t;
        if (t > maxTime) { maxTime = t; maxTimeQ = { q, idx, time: t }; }
        if (t < minTime && t > 0) { minTime = t; minTimeQ = { q, idx, time: t }; }
      }
    });
  }

  const avgCorrectTime = correctCount > 0 ? Math.round(correctTime / correctCount) : 0;
  const avgIncorrectTime = incorrectCount > 0 ? Math.round(incorrectTime / incorrectCount) : 0;

  const totalTrackedTime = correctTime + incorrectTime + unattemptedTime;
  const baseTime = totalTrackedTime > 0 ? totalTrackedTime : Math.max(1, effectiveTotalTime);
  const correctTimePct = Math.min(100, Math.round((correctTime / baseTime) * 100));
  const incorrectTimePct = Math.min(100 - correctTimePct, Math.round((incorrectTime / baseTime) * 100));
  const unattemptedTimePct = Math.max(0, 100 - correctTimePct - incorrectTimePct);

  const renderExplanation = (text) => {
    if (!text) return null;
    const lines = parseExplanationLines(text);
    if (!lines || lines.length === 0) return null;

    if (lines.length === 1) {
      return <p className="explanation-single-line">{lines[0]}</p>;
    }

    return (
      <ul className="explanation-steps-list">
        {lines.map((step, stepIdx) => {
          const clean = step.replace(/^[•\-*]\s*/, '');
          return (
            <li key={stepIdx} className="explanation-step-item">
              <span className="explanation-bullet" aria-hidden="true" />
              <span className="explanation-step-content">{clean}</span>
            </li>
          );
        })}
      </ul>
    );
  };

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

        {/* Time Analysis Section */}
        <div className="time-analytics-card">
          <div className="time-section-header">
            <div className="time-header-title">
              <Clock size={20} className="time-section-icon" aria-hidden="true" />
              <div>
                <h3 className="time-title">Time Analytics</h3>
                <p className="time-subtitle">Detailed breakdown of your pacing per question</p>
              </div>
            </div>
          </div>

          <div className="time-stats-grid">
            <div className="time-stat-box">
              <div className="time-stat-icon-wrap avg-icon">
                <Zap size={18} aria-hidden="true" />
              </div>
              <div className="time-stat-info">
                <span className="time-stat-label">Avg / Question</span>
                <span className="time-stat-val">{formatDuration(avgTimePerQuestion)}</span>
                <span className="time-stat-note">Across {totalQuestions} questions</span>
              </div>
            </div>

            <div className="time-stat-box success-time-box">
              <div className="time-stat-icon-wrap correct-icon">
                <CheckCircle size={18} aria-hidden="true" />
              </div>
              <div className="time-stat-info">
                <span className="time-stat-label">Avg on Correct</span>
                <span className="time-stat-val text-success">{formatDuration(avgCorrectTime)}</span>
                <span className="time-stat-note">Total: {formatDuration(correctTime)}</span>
              </div>
            </div>

            <div className="time-stat-box danger-time-box">
              <div className="time-stat-icon-wrap danger-icon">
                <XCircle size={18} aria-hidden="true" />
              </div>
              <div className="time-stat-info">
                <span className="time-stat-label">Avg on Incorrect</span>
                <span className="time-stat-val text-danger">{formatDuration(avgIncorrectTime)}</span>
                <span className="time-stat-note">Total: {formatDuration(incorrectTime)}</span>
              </div>
            </div>

            <div className="time-stat-box pace-time-box">
              <div className="time-stat-icon-wrap pace-icon">
                <TrendingUp size={18} aria-hidden="true" />
              </div>
              <div className="time-stat-info">
                <span className="time-stat-label">Fastest / Slowest</span>
                <span className="time-stat-val">
                  {minTimeQ ? formatDuration(minTimeQ.time) : '-'} / {maxTimeQ ? formatDuration(maxTimeQ.time) : '-'}
                </span>
                <span className="time-stat-note">
                  {minTimeQ && maxTimeQ ? `Q${minTimeQ.idx + 1} fastest • Q${maxTimeQ.idx + 1} slowest` : 'Equal pace'}
                </span>
              </div>
            </div>
          </div>

          {baseTime > 0 && (
            <div className="time-distribution-container">
              <div className="time-distribution-header">
                <span className="dist-title">Time Distribution</span>
                <div className="dist-legend">
                  <span className="legend-chip"><span className="legend-dot correct-dot" /> Correct: <strong>{correctTimePct}%</strong> ({formatDuration(correctTime)})</span>
                  <span className="legend-chip"><span className="legend-dot incorrect-dot" /> Incorrect: <strong>{incorrectTimePct}%</strong> ({formatDuration(incorrectTime)})</span>
                  {unattemptedTime > 0 && (
                    <span className="legend-chip"><span className="legend-dot unattempted-dot" /> Unattempted: <strong>{unattemptedTimePct}%</strong> ({formatDuration(unattemptedTime)})</span>
                  )}
                </div>
              </div>
              <div className="time-bar" role="progressbar" aria-label="Time distribution bar">
                {correctTimePct > 0 && (
                  <div
                    className="time-bar-segment segment-correct"
                    style={{ width: `${correctTimePct}%` }}
                    title={`Correct: ${formatDuration(correctTime)} (${correctTimePct}%)`}
                  />
                )}
                {incorrectTimePct > 0 && (
                  <div
                    className="time-bar-segment segment-incorrect"
                    style={{ width: `${incorrectTimePct}%` }}
                    title={`Incorrect: ${formatDuration(incorrectTime)} (${incorrectTimePct}%)`}
                  />
                )}
                {unattemptedTimePct > 0 && (
                  <div
                    className="time-bar-segment segment-unattempted"
                    style={{ width: `${unattemptedTimePct}%` }}
                    title={`Unattempted: ${formatDuration(unattemptedTime)} (${unattemptedTimePct}%)`}
                  />
                )}
              </div>
            </div>
          )}
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

              <div className="review-header-controls">
                <div className="review-sort-wrapper">
                  <ArrowUpDown size={14} className="sort-icon" aria-hidden="true" />
                  <label htmlFor="review-sort-select" className="sort-label">Sort:</label>
                  <select
                    id="review-sort-select"
                    className="review-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort review questions"
                  >
                    <option value="original">Question Order</option>
                    <option value="time-desc">Most Time Spent</option>
                    <option value="time-asc">Least Time Spent</option>
                  </select>
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
            </div>
            
            <div className="review-list">
              {exam.questions
                .map((q, idx) => ({ ...q, originalIdx: idx, timeSpent: qTimes[q.id] || 0 }))
                .filter(q => {
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer === q.correctAnswer;
                  const isAttempted = userAnswer !== undefined;
                  
                  if (filter === 'all') return true;
                  if (filter === 'correct') return isCorrect;
                  if (filter === 'incorrect') return isAttempted && !isCorrect;
                  if (filter === 'unattempted') return !isAttempted;
                  return true;
                })
                .sort((a, b) => {
                  if (sortBy === 'time-desc') return b.timeSpent - a.timeSpent;
                  if (sortBy === 'time-asc') return a.timeSpent - b.timeSpent;
                  return a.originalIdx - b.originalIdx;
                })
                .map((q) => {
                  const idx = q.originalIdx;
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer === q.correctAnswer;
                  const isAttempted = userAnswer !== undefined;
                  const isBilingual = isBilingualQuestion(q);
                  const currentLang = questionReviewLangs[q.id] || globalReviewLang;
                  const displayText = getQuestionText(q, currentLang);
                  const displayOptions = getQuestionOptions(q, currentLang);
                  const displayExplanation = getQuestionExplanation(q, currentLang);
                  const qTime = qTimes[q.id] || 0;
                  
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
                        <div className="review-q-header-right">
                          <div className="review-time-pill" title="Time spent on this question">
                            <Clock size={13} aria-hidden="true" />
                            <span>Time: <strong>{formatDuration(qTime)}</strong></span>
                          </div>
                          <span className={`q-status ${isCorrect ? 'text-success' : isAttempted ? 'text-danger' : 'text-warning'}`}>
                            {isCorrect ? 'Correct' : isAttempted ? 'Incorrect' : 'Unattempted'}
                          </span>
                        </div>
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
                          <div className="explanation-header">
                            <Lightbulb size={15} className="explanation-icon" aria-hidden="true" />
                            <span className="explanation-title">Explanation</span>
                          </div>
                          {renderExplanation(displayExplanation)}
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
