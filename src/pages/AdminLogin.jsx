import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { testFirebaseConnection } from '../lib/firebase';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Settings,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  KeyRound,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const AdminLogin = () => {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Firebase Config Drawer state
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [rawConfigInput, setRawConfigInput] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const {
    currentUser,
    login,
    register,
    resetPassword,
    loginAsDemo,
    isConfigured,
    firebaseConfig,
    setCustomConfig,
    removeCustomConfig
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from?.pathname || '/admin';

  useEffect(() => {
    if (currentUser) {
      navigate(destination, { replace: true });
    }
  }, [currentUser, navigate, destination]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Please enter your admin email address.');
      return;
    }

    if (authMode === 'forgot') {
      if (!isConfigured) {
        setError('Firebase backend is not configured yet. Please configure credentials first.');
        setShowConfigDrawer(true);
        return;
      }
      setIsSubmitting(true);
      try {
        await resetPassword(email);
        setSuccessMsg(`Password reset instructions have been sent to ${email}.`);
        setAuthMode('login');
      } catch (err) {
        setError(err.message || 'Failed to send password reset email.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (authMode === 'register') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    if (!isConfigured) {
      setError('Firebase is not configured yet. Configure credentials below or use Demo Mode.');
      setShowConfigDrawer(true);
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate(destination, { replace: true });
    } catch (err) {
      const code = err.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Invalid admin email or password. Please verify your credentials.');
      } else if (code === 'auth/email-already-in-use') {
        setError('An admin account with this email already exists. Please switch to Sign In.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a few moments and try again.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error: Unable to reach Firebase. Please check your internet connection.');
      } else {
        setError(err.message || 'Authentication error. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = () => {
    loginAsDemo();
    navigate(destination, { replace: true });
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setError('');

    try {
      let parsed = null;
      const trimmed = rawConfigInput.trim();

      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        parsed = JSON.parse(trimmed);
      } else if (trimmed.includes('apiKey')) {
        const cleaned = trimmed
          .replace(/const\s+firebaseConfig\s*=\s*/, '')
          .replace(/;\s*$/, '');
        const jsonCompatible = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
        parsed = JSON.parse(jsonCompatible);
      }

      if (!parsed || !parsed.apiKey || !parsed.projectId) {
        throw new Error('Config must contain at least "apiKey" and "projectId".');
      }

      setCustomConfig(parsed);
      setSuccessMsg('Firebase configuration saved successfully! You can now sign in.');
      setRawConfigInput('');
      setTestResults(null);
      setTimeout(() => setShowConfigDrawer(false), 2000);
    } catch (err) {
      setError('Invalid Firebase configuration format: ' + err.message);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResults(null);
    try {
      const res = await testFirebaseConnection();
      setTestResults(res);
    } catch (err) {
      setTestResults({ ok: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetConfig = () => {
    removeCustomConfig();
    setTestResults(null);
    setSuccessMsg('Reset configuration to default .env environment.');
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        {/* Header */}
        <div className="admin-login-header">
          <div className="admin-badge-icon">
            <ShieldCheck size={28} className="icon-shield" />
          </div>
          <h2>Admin Portal</h2>
          <p>Sign in to manage competitive exam question sets &amp; mock papers.</p>
          
          {/* Subtle Status Pill */}
          <div className="admin-status-pill-row">
            {isConfigured ? (
              <div className="admin-status-pill online">
                <span className="status-dot online" />
                <span>Connected: {firebaseConfig?.projectId}</span>
                <button
                  type="button"
                  className="btn-pill-action"
                  onClick={() => setShowConfigDrawer(prev => !prev)}
                  title="Configure Firebase Settings"
                >
                  <Settings size={12} />
                </button>
              </div>
            ) : (
              <div className="admin-status-pill offline">
                <span className="status-dot offline" />
                <span>Firebase Not Connected</span>
                <button
                  type="button"
                  className="btn-pill-action"
                  onClick={() => setShowConfigDrawer(true)}
                >
                  Setup
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div role="alert" className="alert error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div role="status" className="alert success-alert">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Firebase Configuration Drawer */}
        {showConfigDrawer && (
          <div className="config-drawer-card">
            <div className="config-drawer-header">
              <div className="drawer-title">
                <Settings size={15} />
                <h4>Firebase Backend Configuration</h4>
              </div>
              <button
                type="button"
                className="btn-close-drawer"
                onClick={() => setShowConfigDrawer(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <p className="config-help-text">
              Paste your Firebase Web App credentials below to configure Authentication and Firestore Database.
            </p>
            <form onSubmit={handleSaveConfig}>
              <textarea
                className="config-textarea"
                rows={5}
                placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-project.firebaseapp.com",\n  "projectId": "my-project",\n  "storageBucket": "my-project.appspot.com",\n  "messagingSenderId": "123456789",\n  "appId": "1:123456789:web:..."\n}`}
                value={rawConfigInput}
                onChange={(e) => setRawConfigInput(e.target.value)}
              />

              <div className="config-drawer-actions">
                <button
                  type="button"
                  className="btn-secondary-small"
                  onClick={handleTestConnection}
                  disabled={isTesting || (!isConfigured && !rawConfigInput.trim())}
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>

                {firebaseConfig && (
                  <button
                    type="button"
                    className="btn-danger-outline"
                    onClick={handleResetConfig}
                  >
                    Reset
                  </button>
                )}

                <button type="submit" className="btn-primary-small">
                  Save Credentials
                </button>
              </div>

              {testResults && (
                <div className={`connection-test-result ${testResults.ok ? 'success' : 'failure'}`}>
                  {testResults.ok ? (
                    <span>Firebase Connected: Auth and Firestore Database are active.</span>
                  ) : (
                    <span>Connection failed: {testResults.error}</span>
                  )}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="auth-mode-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={authMode === 'login'}
            className={`auth-mode-tab ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => { setAuthMode('login'); setError(''); }}
          >
            <KeyRound size={15} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={authMode === 'register'}
            className={`auth-mode-tab ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => { setAuthMode('register'); setError(''); }}
          >
            <UserPlus size={15} />
            <span>Create Admin</span>
          </button>
        </div>

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="admin-email">Admin Email</label>
            <div className="input-with-icon">
              <Mail size={17} className="input-icon" />
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@govexam.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {authMode !== 'forgot' && (
            <div className="form-group">
              <div className="label-with-action">
                <label htmlFor="admin-password">Password</label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    className="btn-link-action"
                    onClick={() => { setAuthMode('forgot'); setError(''); }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="input-with-icon">
                <Lock size={17} className="input-icon" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="btn-password-toggle"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {authMode === 'register' && (
            <div className="form-group">
              <label htmlFor="admin-confirm-password">Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={17} className="input-icon" />
                <input
                  id="admin-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {authMode === 'forgot' && (
            <div className="forgot-notice">
              <p>Enter your registered email and we will send a password reset link.</p>
              <button
                type="button"
                className="btn-link-action"
                onClick={() => setAuthMode('login')}
              >
                Back to Sign In
              </button>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary btn-login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-small" />
                <span>
                  {authMode === 'login' ? 'Signing in...' : authMode === 'register' ? 'Registering...' : 'Sending email...'}
                </span>
              </>
            ) : (
              <>
                <span>
                  {authMode === 'login' ? 'Sign In to Admin Portal' : authMode === 'register' ? 'Register Admin Account' : 'Send Reset Link'}
                </span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Demo Mode Button */}
        <div className="demo-mode-container">
          <button
            type="button"
            className="btn-demo-mode-subtle"
            onClick={handleDemoLogin}
          >
            <Sparkles size={14} />
            <span>Enter Demo Admin Mode (Offline Preview)</span>
          </button>
        </div>

        {/* Setup Accordion */}
        <div className="admin-login-footer">
          <button
            type="button"
            className="btn-setup-guide-toggle"
            onClick={() => setShowSetupGuide(prev => !prev)}
          >
            <div className="guide-toggle-title">
              <HelpCircle size={14} />
              <span>Firebase Setup Instructions</span>
            </div>
            {showSetupGuide ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showSetupGuide && (
            <div className="setup-guide-box">
              <ol>
                <li>
                  Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">Firebase Console</a> and open your project.
                </li>
                <li>
                  Under <strong>Build &gt; Authentication &gt; Sign-in method</strong>, enable <strong>Email/Password</strong>.
                </li>
                <li>
                  Under <strong>Build &gt; Firestore Database</strong>, click <strong>Create database</strong> (choose Start in test mode).
                </li>
                <li>
                  Copy your <code>firebaseConfig</code> credentials into <code>.env</code> or into the <strong>Setup</strong> drawer above.
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
