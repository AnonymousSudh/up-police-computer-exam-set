import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { PlayCircle, Clock, FileQuestion } from 'lucide-react';
import { AdBanner } from '../components/AdBanner';

const Home = () => {
  const { exams } = useExam();
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-header">
        <h2>Available Exams</h2>
        <p>Select an exam to begin your simulation</p>
      </div>

      <AdBanner dataAdSlot="HOME_PAGE_TOP_SLOT" className="hide-on-large" />

      <div className="exams-grid">
        {exams.map((exam) => (
          <div key={exam.id} className="exam-card">
            <div className="exam-card-header">
              <h3>{exam.title}</h3>
            </div>
            <div className="exam-card-body">
              <div className="exam-detail">
                <Clock size={18} />
                <span>{exam.durationMinutes} Minutes</span>
              </div>
              <div className="exam-detail">
                <FileQuestion size={18} />
                <span>{exam.questions?.length || 0} Questions</span>
              </div>
            </div>
            <div className="exam-card-footer">
              <button 
                className="btn-primary"
                onClick={() => navigate(`/exam/${exam.id}`)}
              >
                <PlayCircle size={18} />
                Start Exam
              </button>
            </div>
          </div>
        ))}
        {exams.length === 0 && (
          <div className="empty-state">
            <p>No exams available. Please import an exam to continue.</p>
            <button className="btn-secondary" onClick={() => navigate('/import')}>
              Import Custom Exam
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
