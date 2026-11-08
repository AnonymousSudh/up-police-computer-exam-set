import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Individual Toast Notification item with progress bar, hover-pause, and auto-dismiss.
 */
export const Toast = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(toast.duration || 7500);
  const timerRef = useRef(null);

  const duration = toast.duration || 7500;
  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  useEffect(() => {
    if (isPaused) return;

    const interval = 50;
    const step = (interval / duration) * 100;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(progressInterval);
          return 0;
        }
        return Math.max(0, prev - step);
      });
    }, interval);

    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, remainingTimeRef.current);

    startTimeRef.current = Date.now();

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timerRef.current);
    };
  }, [isPaused, duration, onDismiss, toast.id]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    clearTimeout(timerRef.current);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div
      className={`app-toast toast-${toast.type || 'info'}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="toast-glow" />
      <div className="toast-content-wrapper">
        <div className="toast-icon-box">
          {isSuccess && <CheckCircle2 size={22} className="toast-icon icon-success" />}
          {isError && <AlertCircle size={22} className="toast-icon icon-error" />}
          {!isSuccess && !isError && <Info size={22} className="toast-icon icon-info" />}
        </div>

        <div className="toast-body">
          {toast.title && <h4 className="toast-title">{toast.title}</h4>}
          <div className="toast-message">{toast.message}</div>

          {toast.examId && (
            <div className="toast-actions">
              <Link to={`/exam/${toast.examId}`} className="toast-action-btn">
                <span>View Candidate Live Exam</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          className="toast-close-btn"
          onClick={() => onDismiss(toast.id)}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>

      <div className="toast-progress-track">
        <div
          className={`toast-progress-bar bar-${toast.type || 'info'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Container rendering all floating toast notifications in the top-right corner.
 */
export const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-label="Notifications" role="region">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
