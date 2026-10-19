import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { useAuth } from '../context/AuthContext';
import { 
  PlayCircle, 
  Clock, 
  FileQuestion, 
  Shield, 
  Train, 
  Layers, 
  Search, 
  UploadCloud, 
  Languages
} from 'lucide-react';
import { AdBanner } from '../components/AdBanner';

const Home = () => {
  const { exams } = useExam();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read category from query param if available ('up-police', 'rrb', or 'all')
  const activeCategory = searchParams.get('exam') || 'all';
  const [searchQuery, setSearchQuery] = useState('');

  const scrollToTests = () => {
    setTimeout(() => {
      const target = document.getElementById('tests-list');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleCategorySelect = (categoryId, autoScroll = true) => {
    if (categoryId === 'all') {
      searchParams.delete('exam');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ exam: categoryId });
    }

    if (autoScroll) {
      scrollToTests();
    }
  };

  // Helper to determine which category an exam belongs to
  const getExamCategory = (exam) => {
    if (exam.category) return exam.category;
    if (exam.id.includes('rrb')) return 'rrb';
    if (exam.id.includes('police') || exam.id.includes('computer-operator')) return 'up-police';
    return 'custom';
  };

  // Group stats for each category
  const categoryStats = useMemo(() => {
    const counts = { 'all': exams.length, 'up-police': 0, 'rrb': 0, 'custom': 0 };
    for (const exam of exams) {
      const cat = getExamCategory(exam);
      if (counts[cat] !== undefined) counts[cat]++;
      else counts.custom++;
    }
    return counts;
  }, [exams]);

  // Filter exams based on active category and search query
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const cat = getExamCategory(exam);
      const matchesCategory = activeCategory === 'all' || cat === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        exam.title?.toLowerCase().includes(q) ||
        exam.description?.toLowerCase().includes(q) ||
        exam.badge?.toLowerCase().includes(q)
      );
    });
  }, [exams, activeCategory, searchQuery]);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="portal-hero">
        <div className="hero-content">
          <h2 className="hero-title">Select Your Examination</h2>
          <p className="hero-subtitle">
            Prepare for state and national competitive examinations with official-pattern mock tests, 
            bilingual questions (Hindi &amp; English), timed simulators, and in-depth performance analytics.
          </p>
        </div>
      </section>

      {/* Exam Category Cards */}
      <section className="exam-selection-section">
        <div className="section-header">
          <h3 className="section-title">Available Exam Streams</h3>
          <p className="section-desc">Choose an examination to filter mock test papers or browse all available sets below.</p>
        </div>

        <div className="category-cards-grid">
          {/* UP Police Category Card */}
          <div 
            className={`category-card up-police-card ${activeCategory === 'up-police' ? 'selected' : ''}`}
            onClick={() => handleCategorySelect('up-police')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleCategorySelect('up-police')}
          >
            <div className="category-card-top">
              <div className="category-icon-wrapper police-icon-bg">
                <Shield size={24} />
              </div>
              <span className="category-badge">State Police</span>
            </div>
            <div className="category-card-info">
              <h4>UP Police Exam</h4>
              <p className="category-desc">Computer Operator Grade-A, SI &amp; Constable Practice Sets &amp; Full Forms.</p>
            </div>
            <div className="category-card-footer">
              <span className="exam-count-chip">{categoryStats['up-police']} Tests Available</span>
              <button 
                type="button"
                className={`btn-category-action ${activeCategory === 'up-police' ? 'active-btn' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleCategorySelect('up-police'); }}
              >
                {activeCategory === 'up-police' ? 'Selected' : 'Select Exam'}
              </button>
            </div>
          </div>

          {/* RRB Railway Category Card */}
          <div 
            className={`category-card rrb-card ${activeCategory === 'rrb' ? 'selected' : ''}`}
            onClick={() => handleCategorySelect('rrb')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleCategorySelect('rrb')}
          >
            <div className="category-card-top">
              <div className="category-icon-wrapper rrb-icon-bg">
                <Train size={24} />
              </div>
              <span className="category-badge rrb-badge">Indian Railways</span>
            </div>
            <div className="category-card-info">
              <h4>RRB Railway Exam</h4>
              <p className="category-desc">RRB NTPC, Group D, ALP &amp; Technical tests with General Awareness, Science &amp; Math.</p>
            </div>
            <div className="category-card-footer">
              <span className="exam-count-chip">{categoryStats['rrb']} Test Available</span>
              <button 
                type="button"
                className={`btn-category-action ${activeCategory === 'rrb' ? 'active-btn' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleCategorySelect('rrb'); }}
              >
                {activeCategory === 'rrb' ? 'Selected' : 'Select Exam'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <AdBanner dataAdSlot="HOME_PAGE_TOP_SLOT" className="hide-on-large" />

      {/* Test Papers List Section with Filter Tabs & Search */}
      <section className="test-papers-section" id="tests-list">
        <div className="section-header tests-section-header">
          <h3 className="section-title">
            {activeCategory === 'all' 
              ? 'All Available Practice Tests' 
              : activeCategory === 'up-police' 
              ? 'UP Police Practice Tests' 
              : activeCategory === 'rrb' 
              ? 'RRB Railway Practice Tests' 
              : 'Custom Practice Tests'}
          </h3>
          <p className="section-desc">
            Showing {filteredExams.length} {filteredExams.length === 1 ? 'mock test paper' : 'mock test papers'}. Select a paper to begin your simulation.
          </p>
        </div>

        <div className="filter-toolbar">
          <div className="category-tabs" role="tablist" aria-label="Exam Category Filter">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'all'}
              className={`category-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => handleCategorySelect('all')}
            >
              <Layers size={16} />
              <span>All Exams ({categoryStats.all})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'up-police'}
              className={`category-tab ${activeCategory === 'up-police' ? 'active' : ''}`}
              onClick={() => handleCategorySelect('up-police')}
            >
              <Shield size={16} />
              <span>UP Police ({categoryStats['up-police']})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'rrb'}
              className={`category-tab ${activeCategory === 'rrb' ? 'active' : ''}`}
              onClick={() => handleCategorySelect('rrb')}
            >
              <Train size={16} />
              <span>RRB Railway ({categoryStats['rrb']})</span>
            </button>
            {categoryStats.custom > 0 && (
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'custom'}
                className={`category-tab ${activeCategory === 'custom' ? 'active' : ''}`}
                onClick={() => handleCategorySelect('custom')}
              >
                <UploadCloud size={16} />
                <span>Custom / Imported ({categoryStats.custom})</span>
              </button>
            )}
          </div>

          <div className="search-bar-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search tests by title or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search mock tests"
            />
            {searchQuery && (
              <button 
                type="button" 
                className="clear-search-btn" 
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Notice */}
        {activeCategory !== 'all' && (
          <div className="active-filter-banner">
            <span>
              Showing tests for: <strong>{activeCategory === 'up-police' ? 'UP Police Exam' : activeCategory === 'rrb' ? 'RRB Railway Exam' : 'Custom / Imported'}</strong>
            </span>
            <button 
              type="button" 
              className="reset-filter-btn" 
              onClick={() => handleCategorySelect('all')}
            >
              Show All Exams
            </button>
          </div>
        )}

        {/* Exams Cards Grid */}
        <div className="exams-grid">
          {filteredExams.map((exam) => {
            const cat = getExamCategory(exam);
            const isBilingual = exam.questions?.some(q => q.text_hi || q.question_hindi || (Array.isArray(q.options_hi) && q.options_hi.some(Boolean)));

            return (
              <div key={exam.id} className={`exam-card exam-card-themed ${cat}-theme`}>
                <div className="exam-card-header">
                  <div className="exam-card-tags">
                    <span className={`exam-category-tag tag-${cat}`}>
                      {cat === 'up-police' ? 'UP Police' : cat === 'rrb' ? 'RRB Railway' : 'Custom'}
                    </span>
                    {exam.badge && <span className="exam-badge">{exam.badge}</span>}
                    {isBilingual && (
                      <span className="exam-lang-badge" title="Hindi & English questions available">
                        <Languages size={12} />
                        Bilingual
                      </span>
                    )}
                  </div>
                  <h3>{exam.title}</h3>
                  {exam.description && <p className="exam-description">{exam.description}</p>}
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

                {exam.researchNote && (
                  <details className="exam-research-note">
                    <summary>About this question set</summary>
                    <p>{exam.researchNote} Source links appear in the answer review.</p>
                  </details>
                )}

                <div className="exam-card-footer">
                  <button 
                    className="btn-primary btn-start-exam"
                    onClick={() => navigate(`/exam/${encodeURIComponent(exam.id)}`)}
                  >
                    <PlayCircle size={18} />
                    Start Exam
                  </button>
                </div>
              </div>
            );
          })}

          {filteredExams.length === 0 && (
            <div className="empty-state">
              <FileQuestion size={48} className="empty-icon" />
              <h3>No Mock Tests Found</h3>
              <p>
                {searchQuery 
                  ? `No tests matching "${searchQuery}". Try a different keyword.` 
                  : `No mock tests found for this category.`}
              </p>
              <div className="empty-actions">
                {searchQuery && (
                  <button className="btn-secondary" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </button>
                )}
                {currentUser ? (
                  <button className="btn-primary" onClick={() => navigate('/admin')}>
                    <UploadCloud size={16} />
                    <span>Upload Exam Paper (Admin)</span>
                  </button>
                ) : (
                  <button className="btn-primary" onClick={() => handleCategorySelect('all')}>
                    View All Mock Tests
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
