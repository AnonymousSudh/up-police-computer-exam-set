import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Shield, Train, Layers, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentExam = searchParams.get('exam');
  const { currentUser } = useAuth();

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo-section">
          <img src="/favicon.svg" alt="" width="32" height="32" className="logo-icon" />
          <div className="logo-text-group">
            <h1 className="logo-text">GovExam Portal</h1>
            <span className="logo-badge">UP Police • RRB Railways</span>
          </div>
        </Link>
        <nav className="header-nav" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive && !currentExam ? 'active' : ''}`}
          >
            <Layers size={16} />
            <span>All Exams</span>
          </NavLink>
          <NavLink
            to="/?exam=up-police"
            className={() => `nav-link ${location.pathname === '/' && currentExam === 'up-police' ? 'active' : ''}`}
          >
            <Shield size={16} />
            <span>UP Police</span>
          </NavLink>
          <NavLink
            to="/?exam=rrb"
            className={() => `nav-link ${location.pathname === '/' && currentExam === 'rrb' ? 'active' : ''}`}
          >
            <Train size={16} />
            <span>RRB Railway</span>
          </NavLink>

          <NavLink
            to={currentUser ? "/admin" : "/admin/login"}
            className={({ isActive }) => `nav-link admin-nav-link ${isActive ? 'active' : ''}`}
            title={currentUser ? `Logged in as ${currentUser.email}` : "Admin Login"}
          >
            {currentUser ? (
              <>
                <ShieldCheck size={16} className="admin-icon-active" />
                <span>Admin Panel</span>
                <span className="admin-status-dot online" aria-label="Online" />
              </>
            ) : (
              <>
                <Lock size={15} />
                <span>Admin</span>
              </>
            )}
          </NavLink>
        </nav>
      </div>
    </header>
  );
};
