import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ExamProvider } from './context/ExamContext';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ExamSimulator from './pages/ExamSimulator';
import Result from './pages/Result';
import './App.css';
import './index.css';
import { AdBanner, hasSideAds } from './components/AdBanner';

function ExamRoute() {
  const { id } = useParams();
  return <ExamSimulator key={id} />;
}

function AppLayout() {
  const location = useLocation();
  const isAdminLogin = location.pathname === '/admin/login';
  const isAdminDashboard = location.pathname === '/admin';
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={`app-container ${isAdminLogin ? 'admin-login-layout' : ''} ${isAdminDashboard ? 'admin-page-layout' : ''}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {!isAdminDashboard && <Header />}
      <div className={`layout-with-ads ${isAdminLogin ? 'layout-admin-login' : ''} ${isAdminDashboard ? 'layout-admin-dashboard' : ''}`}>
        {hasSideAds && !isAdminDashboard && (
          <div className="side-ad left-ad">
            <AdBanner dataAdSlot="LEFT_SIDE_AD" className="vertical-ad" style={{ height: '100%', minHeight: '600px' }} />
          </div>
        )}
        
        <main id="main-content" tabIndex={-1} className={`main-content ${isAdminLogin ? 'main-content-login' : ''} ${isAdminDashboard ? 'main-content-admin' : ''}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            {/* Shift import to admin */}
            <Route path="/import" element={<Navigate to="/admin" replace />} />
            <Route path="/exam/:id" element={<ExamRoute />} />
            <Route path="/result" element={<Result />} />
            <Route path="*" element={<div className="empty-state"><h2>Page not found</h2><Link to="/" className="nav-link">Return to available exams</Link></div>} />
          </Routes>
        </main>
        
        {hasSideAds && !isAdminDashboard && (
          <div className="side-ad right-ad">
            <AdBanner dataAdSlot="RIGHT_SIDE_AD" className="vertical-ad" style={{ height: '100%', minHeight: '600px' }} />
          </div>
        )}
      </div>
      {!isAdminRoute && (
        <footer className="app-footer">Independent practice platform for competitive examinations. Not affiliated with UP Police or Indian Railways. Powered by Firebase Backend.</footer>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ExamProvider>
        <Router>
          <AppLayout />
        </Router>
      </ExamProvider>
    </AuthProvider>
  );
}

export default App;
