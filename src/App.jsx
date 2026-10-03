import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { ExamProvider } from './context/ExamContext';
import { Header } from './components/Header';
import Home from './pages/Home';
import ImportExam from './pages/ImportExam';
import ExamSimulator from './pages/ExamSimulator';
import Result from './pages/Result';
import './App.css';
import './index.css';
import { AdBanner, hasSideAds } from './components/AdBanner';

function ExamRoute() {
  const { id } = useParams();
  return <ExamSimulator key={id} />;
}

function App() {
  return (
    <ExamProvider>
      <Router>
        <div className="app-container">
          <a className="skip-link" href="#main-content">Skip to content</a>
          <Header />
          <div className="layout-with-ads">
            {hasSideAds && <div className="side-ad left-ad">
              <AdBanner dataAdSlot="LEFT_SIDE_AD" className="vertical-ad" style={{ height: '100%', minHeight: '600px' }} />
            </div>}
            
            <main id="main-content" tabIndex={-1} className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/import" element={<ImportExam />} />
                <Route path="/exam/:id" element={<ExamRoute />} />
                <Route path="/result" element={<Result />} />
                <Route path="*" element={<div className="empty-state"><h2>Page not found</h2><Link to="/" className="nav-link">Return to available exams</Link></div>} />
              </Routes>
            </main>
            
            {hasSideAds && <div className="side-ad right-ad">
              <AdBanner dataAdSlot="RIGHT_SIDE_AD" className="vertical-ad" style={{ height: '100%', minHeight: '600px' }} />
            </div>}
          </div>
          <footer className="app-footer">Independent practice tool. Not affiliated with UP Police. Exams and results stay in your browser.</footer>
        </div>
      </Router>
    </ExamProvider>
  );
}

export default App;
