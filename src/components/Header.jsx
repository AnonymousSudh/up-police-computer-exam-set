import React from 'react';
import { Link, NavLink } from 'react-router-dom';


export const Header = () => {
  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo-section">
          <img src="/favicon.svg" alt="" width="32" height="32" className="logo-icon" />
          <h1 className="logo-text">UP Police Exam Set</h1>
        </Link>
        <nav className="header-nav" aria-label="Main navigation">
          <NavLink to="/" end className="nav-link">Home</NavLink>
          <NavLink to="/import" className="nav-link import-link">Import Exam</NavLink>
        </nav>
      </div>
    </header>
  );
};
