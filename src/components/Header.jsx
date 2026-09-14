import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export const Header = () => {
  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo-section">
          <BookOpen className="logo-icon" />
          <h1 className="logo-text">UP Police Exam Set</h1>
        </Link>
        <nav className="header-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/import" className="nav-link import-link">Import Custom Exam</Link>
        </nav>
      </div>
    </header>
  );
};
