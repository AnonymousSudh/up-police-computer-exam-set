import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ExamProvider } from './context/ExamContext';
import { Header } from './components/Header';
import Home from './pages/Home';
import ImportExam from './pages/ImportExam';
import ExamSimulator from './pages/ExamSimulator';
import Result from './pages/Result';
import './App.css';
import './index.css';

function App() {
  return (
    <ExamProvider>
      <Router>
        <div className="app-container">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/import" element={<ImportExam />} />
              <Route path="/exam/:id" element={<ExamSimulator />} />
              <Route path="/result" element={<Result />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ExamProvider>
  );
}

export default App;
