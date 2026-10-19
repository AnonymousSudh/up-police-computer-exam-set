import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useExam } from '../context/ExamContext';
import { downloadExamJson } from '../lib/firebase';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Camera,
  Copy,
  Check,
  X,
  LogOut,
  ExternalLink,
  Layers,
  FileText,
  Trash2,
  Database,
  PlayCircle,
  Settings,
  Download,
  FileUp,
  Search,
  HardDrive,
  CheckCheck,
  Clock,
  Type,
  Tag
} from 'lucide-react';
import { AI_IMAGE_OCR_PROMPT } from './ImportExam';
import { EXAM_CATEGORIES } from '../data/exams/categories';

const AdminDashboard = () => {
  const { currentUser, logout, isConfigured, firebaseConfig, setCustomConfig, removeCustomConfig } = useAuth();
  const { exams, addExam, deleteExam, refreshExams } = useExam();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'exams' | 'settings'

  // Import Tab State
  const [jsonInput, setJsonInput] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examDuration, setExamDuration] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('rrb');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedStorageRules, setCopiedStorageRules] = useState(false);

  // Manage Exams Search & Filter
  const [manageSearch, setManageSearch] = useState('');
  const [manageCategoryFilter, setManageCategoryFilter] = useState('all');

  // Settings Tab State
  const [settingsConfigInput, setSettingsConfigInput] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowPromptModal(false);
    };
    if (showPromptModal) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showPromptModal]);

  // Synchronized field updates between metadata inputs and raw JSON
  const handleTitleChange = (val) => {
    setExamTitle(val);
    try {
      if (jsonInput.trim()) {
        const parsed = JSON.parse(jsonInput);
        parsed.title = val;
        setJsonInput(JSON.stringify(parsed, null, 2));
      }
    } catch {
      // ignore JSON parse error while user edits
    }
  };

  const handleDurationChange = (val) => {
    setExamDuration(val);
    try {
      if (jsonInput.trim()) {
        const parsed = JSON.parse(jsonInput);
        const num = Number(val);
        if (!isNaN(num) && num > 0) {
          parsed.durationMinutes = num;
        }
        setJsonInput(JSON.stringify(parsed, null, 2));
      }
    } catch {
      // ignore
    }
  };

  const handleCategoryChange = (val) => {
    setSelectedCategory(val);
    try {
      if (jsonInput.trim()) {
        const parsed = JSON.parse(jsonInput);
        parsed.category = val;
        setJsonInput(JSON.stringify(parsed, null, 2));
      }
    } catch {
      // ignore
    }
  };

  const handleJsonChange = (val) => {
    setJsonInput(val);
    try {
      const parsed = JSON.parse(val);
      if (parsed.title) setExamTitle(parsed.title);
      if (parsed.durationMinutes) setExamDuration(String(parsed.durationMinutes));
      if (parsed.category) setSelectedCategory(parsed.category);
    } catch {
      // While user is typing partial JSON, do not wipe metadata fields
    }
  };

  const handleClearAll = () => {
    setJsonInput('');
    setUploadedFileName('');
    setExamTitle('');
    setExamDuration('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Read and validate dropped or selected file
  const processUploadedFile = async (file) => {
    setError('');
    setSuccess('');
    if (!file) return;

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setError('Please upload a valid .json file.');
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setUploadedFileName(file.name);
      if (parsed.title) setExamTitle(parsed.title);
      if (parsed.durationMinutes) setExamDuration(String(parsed.durationMinutes));
      if (parsed.category) setSelectedCategory(parsed.category);

      const qCount = Array.isArray(parsed.questions) ? parsed.questions.length : 0;
      setSuccess(`File "${file.name}" loaded with ${qCount} questions. You can customize the Name and Duration above before saving.`);
    } catch (err) {
      setError(`Failed to parse "${file.name}": ${err.message}`);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processUploadedFile(file);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_IMAGE_OCR_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = AI_IMAGE_OCR_PROMPT;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Inspect entered JSON to display live preview
  const inspectExamJson = () => {
    if (!jsonInput.trim()) return null;
    try {
      const parsed = JSON.parse(jsonInput);
      const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
      const hasBilingual = questions.some(q => q.question_hindi || q.text_hi || q.option_text_hindi);
      return {
        valid: true,
        title: examTitle.trim() || parsed.title || 'Untitled',
        questionCount: questions.length,
        durationMinutes: (examDuration && Number(examDuration) > 0) ? Number(examDuration) : (parsed.durationMinutes || 60),
        isBilingual: hasBilingual,
        id: parsed.id || null
      };
    } catch {
      return { valid: false };
    }
  };

  const livePreview = inspectExamJson();

  const handleDeployExam = async () => {
    setError('');
    setSuccess('');

    try {
      if (!jsonInput.trim()) {
        throw new Error('Please upload a .json file or enter question paper JSON.');
      }

      let parsedData;
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (parseErr) {
        throw new Error('Invalid JSON format: ' + parseErr.message);
      }

      if (jsonInput.length > 5_000_000) {
        throw new Error('Exam JSON must be smaller than 5 MB.');
      }

      // Override with user's configured title and duration if provided
      if (examTitle.trim()) {
        parsedData.title = examTitle.trim();
      }
      if (examDuration && Number(examDuration) > 0) {
        parsedData.durationMinutes = Number(examDuration);
      }

      // Attach selected category
      if (selectedCategory) {
        parsedData.category = selectedCategory;
      } else if (!parsedData.category) {
        parsedData.category = 'rrb';
      }

      setIsSaving(true);
      const saved = await addExam(parsedData);

      const storageNotice = isConfigured
        ? ' Question paper saved to Firebase Cloud Firestore! (Live instantly for candidates)'
        : ' (Saved to local storage. Connect Firebase backend for cloud sync).';

      setSuccess(`Exam "${saved.title || parsedData.title || 'Untitled'}" (${saved.durationMinutes || parsedData.durationMinutes} mins) successfully deployed!${storageNotice}`);
      handleClearAll();

      // Refresh list
      if (refreshExams) await refreshExams();
    } catch (err) {
      setError(err.message || 'Failed to deploy exam.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExam = async (examId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will delete the exam JSON from Firebase Cloud Storage and Firestore.`)) {
      return;
    }

    try {
      await deleteExam(examId);
      setSuccess(`Exam "${title}" was removed from Firebase.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(`Failed to delete exam: ${err.message}`);
    }
  };

  const handleDownloadExam = (examItem) => {
    downloadExamJson(examItem);
  };

  const loadSample = () => {
    setUploadedFileName('');
    const sampleObj = {
      title: "Sample Bilingual Railway Mock Test",
      category: selectedCategory,
      durationMinutes: 60,
      questions: [
        {
          question_number: 1,
          question_english: "Rachin travels a distance for 2 hours at a speed of 60 km/h and an 80 km distance at a speed of 40 km/h. Find Rachin's average speed (in km/h).",
          question_hindi: "रचिन एक दूरी 2 घंटे तक 60 किमी०/घंटे की चाल से और 80 किमी० की दूरी 40 किमी०/घंटे की चाल से तय करता है। रचिन की औसत चाल (किमी०/घंटे में) ज्ञात कीजिए।",
          options: [
            { option_label: "a", option_text_english: "50", option_text_hindi: "50" },
            { option_label: "b", option_text_english: "59", option_text_hindi: "59" },
            { option_label: "c", option_text_english: "55", option_text_hindi: "55" },
            { option_label: "d", option_text_english: "47", option_text_hindi: "47" }
          ],
          correct_option_label: "a",
          explanation_english: "• Total distance = (2 * 60) + 80 = 120 + 80 = 200 km\n• Total time = 2 + (80 / 40) = 2 + 2 = 4 hours\n• Average speed = Total distance / Total time = 200 / 4 = 50 km/h",
          explanation_hindi: "• कुल दूरी = (2 * 60) + 80 = 120 + 80 = 200 किमी\n• कुल समय = 2 + (80 / 40) = 2 + 2 = 4 घंटे\n• औसत चाल = कुल दूरी / कुल समय = 200 / 4 = 50 किमी/घंटा"
        },
        {
          question_number: 2,
          question_english: "Which computer memory is volatile and loses contents when powered off?",
          question_hindi: "कौन सी कंप्यूटर मेमोरी अस्थिर (Volatile) होती है और बिजली बंद होने पर डेटा खो देती है?",
          options: [
            { option_label: "a", option_text_english: "ROM", option_text_hindi: "रॉम (ROM)" },
            { option_label: "b", option_text_english: "RAM", option_text_hindi: "रैम (RAM)" },
            { option_label: "c", option_text_english: "Hard Disk", option_text_hindi: "हार्ड डिस्क" },
            { option_label: "d", option_text_english: "Flash Memory", option_text_hindi: "फ्लैश मेमोरी" }
          ],
          correct_option_label: "b",
          explanation_english: "RAM (Random Access Memory) is volatile and requires continuous power.",
          explanation_hindi: "रैम (RAM) एक अस्थिर मेमोरी है जिसे डेटा बनाए रखने के लिए बिजली की आवश्यकता होती है।"
        }
      ]
    };
    setExamTitle(sampleObj.title);
    setExamDuration(String(sampleObj.durationMinutes));
    setJsonInput(JSON.stringify(sampleObj, null, 2));
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSettingsSuccess('');
    setError('');

    try {
      const parsed = JSON.parse(settingsConfigInput.trim());
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('Config must contain apiKey and projectId');
      }
      setCustomConfig(parsed);
      setSettingsSuccess('Firebase configuration saved successfully!');
      setSettingsConfigInput('');
    } catch (err) {
      setError('Invalid configuration format: ' + err.message);
    }
  };

  // Filtered exams for Manage Tab
  const filteredExams = exams.filter(ex => {
    const matchesCat = manageCategoryFilter === 'all' || ex.category === manageCategoryFilter;
    if (!matchesCat) return false;
    if (!manageSearch.trim()) return true;
    const q = manageSearch.toLowerCase();
    return ex.title?.toLowerCase().includes(q) || ex.id?.toLowerCase().includes(q);
  });

  const firestoreRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone can read exam questions
    match /exams/{examId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`;

  const storageRulesSnippet = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /exams/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`;

  const copyToClipboard = (text, setFlag) => {
    navigator.clipboard.writeText(text).then(() => {
      setFlag(true);
      setTimeout(() => setFlag(false), 2500);
    });
  };

  return (
    <div className="admin-page-wrapper">
      {/* Top Admin Navigation Bar - Unified Single Header */}
      <header className="admin-unified-header">
        <div className="admin-header-inner">
          <div className="admin-header-left">
            <div className="admin-brand-group">
              <img src="/favicon.svg" alt="" width="26" height="26" className="admin-logo-img" />
              <span className="admin-brand-title">GovExam</span>
              <span className="admin-brand-tag">Admin Control Panel</span>
            </div>

            <div className="admin-status-indicator" title={isConfigured ? "Firebase Backend Connected" : "Local Demo Mode"}>
              <span className={`status-dot ${isConfigured ? 'online' : 'offline'}`} />
              <span className="status-label">
                {isConfigured ? `Firebase: ${firebaseConfig?.projectId || 'Connected'}` : 'Local / Demo Mode'}
              </span>
            </div>
          </div>

          <div className="admin-header-right">
            <div className="admin-user-pill" title={`Signed in as ${currentUser?.email || 'Admin'}`}>
              <span className="admin-user-dot" />
              <span className="admin-user-email">{currentUser?.email || 'Admin'}</span>
            </div>
            <button
              type="button"
              className="btn-admin-header-nav"
              onClick={() => navigate('/')}
              title="Open public candidate portal"
            >
              <ExternalLink size={14} />
              <span>View Portal</span>
            </button>
            <button
              type="button"
              className="btn-admin-header-logout"
              onClick={logout}
              title="Sign out of admin session"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <div className="admin-dashboard-container">
        {/* Main Admin Card */}
        <div className="admin-main-card">
        {/* Tab Header */}
        <div className="admin-tabs-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'import'}
            className={`admin-tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            <UploadCloud size={16} />
            <span>Upload &amp; Import JSON</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'exams'}
            className={`admin-tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
            onClick={() => setActiveTab('exams')}
          >
            <Layers size={16} />
            <span>Manage Exam Sets ({exams.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'settings'}
            className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} />
            <span>Firebase &amp; Cloud Storage</span>
          </button>
        </div>

        {error && (
          <div role="alert" className="alert error-alert admin-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div role="status" className="alert success-alert admin-alert">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* TAB 1: IMPORT QUESTION SET */}
        {activeTab === 'import' && (
          <div className="admin-tab-content">
            <div className="import-section-header">
              <div>
                <h3>Upload &amp; Import Question Paper</h3>
                <p>
                  Deploy question papers dynamically to <strong>Firebase Cloud Storage &amp; Firestore</strong>.
                </p>
              </div>
            </div>

            {/* Quick Exam Settings (Editable Title, Duration & Stream) */}
            <div className="exam-metadata-editor-card">
              <div className="editor-card-header">
                <div className="editor-card-title">
                  <FileText size={18} className="editor-icon" />
                  <span>Exam Details &amp; Settings (Customizable on Upload)</span>
                </div>
                <span className="editor-badge">Auto-syncs with JSON</span>
              </div>
              <div className="metadata-inputs-grid">
                <div className="metadata-field">
                  <label htmlFor="meta-exam-title">
                    <Type size={14} />
                    <span>Exam Name / Title</span>
                  </label>
                  <input
                    id="meta-exam-title"
                    type="text"
                    className="admin-input"
                    placeholder="e.g. Full Form MCQ — Part 1 (Simple)"
                    value={examTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                  />
                </div>

                <div className="metadata-field">
                  <label htmlFor="meta-exam-duration">
                    <Clock size={14} />
                    <span>Duration (Minutes)</span>
                  </label>
                  <input
                    id="meta-exam-duration"
                    type="number"
                    min="1"
                    max="600"
                    className="admin-input"
                    placeholder="e.g. 60"
                    value={examDuration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                  />
                </div>

                <div className="metadata-field">
                  <label htmlFor="meta-exam-category">
                    <Tag size={14} />
                    <span>Target Stream</span>
                  </label>
                  <select
                    id="meta-exam-category"
                    className="admin-select"
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    {EXAM_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    <option value="custom">General / Custom Stream</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Side-by-Side: File Upload on Left & Raw JSON Paste on Right */}
            <div className="import-side-by-side-grid">
              {/* Left Side: Upload Question Paper JSON */}
              <div className="import-column import-column-upload">
                <div className="column-header">
                  <div className="column-title-box">
                    <UploadCloud size={18} />
                    <h4>Upload Question Paper JSON</h4>
                  </div>
                  <span className="column-hint">File Drop or Browse</span>
                </div>

                <div
                  className={`file-drop-zone side-drop-zone ${isDragging ? 'dragging' : ''} ${uploadedFileName ? 'has-file' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".json,application/json"
                    onChange={handleFileChange}
                  />
                  <FileUp size={36} className="drop-icon" />
                  {uploadedFileName ? (
                    <div className="drop-text-group">
                      <strong>Loaded: {uploadedFileName}</strong>
                      <span className="file-ready-tag">JSON parsed &amp; fields populated above</span>
                      <span className="click-sub">Click or drag another .json to replace</span>
                    </div>
                  ) : (
                    <div className="drop-text-group">
                      <strong>Click to select a Question Paper (.json)</strong>
                      <span>or drag &amp; drop file here</span>
                      <span className="file-specs-note">Auto-populates title, duration &amp; questions</span>
                    </div>
                  )}
                </div>

                {uploadedFileName && (
                  <div className="loaded-file-indicator">
                    <CheckCircle2 size={16} className="success-icon" />
                    <span>Active File: <strong>{uploadedFileName}</strong></span>
                    <button
                      type="button"
                      className="btn-clear-file"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFileName('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      title="Clear uploaded file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: Or Paste Bilingual JSON Payload (Hindi + English) */}
              <div className="import-column import-column-paste">
                <div className="column-header">
                  <div className="column-title-box">
                    <FileText size={18} />
                    <h4>Or Paste Bilingual JSON Payload (Hindi + English)</h4>
                  </div>
                  <div className="sample-buttons">
                    <button
                      type="button"
                      className="btn-sample"
                      onClick={loadSample}
                    >
                      Load Sample
                    </button>
                    <button
                      type="button"
                      className="btn-sample btn-sample-prompt"
                      onClick={() => setShowPromptModal(true)}
                      title="View prompt to convert question photos to JSON with AI"
                    >
                      <Camera size={13} />
                      <span>AI OCR Prompt</span>
                    </button>
                    <button
                      type="button"
                      className={`btn-sample btn-sample-copy ${copied ? 'copied-btn' : ''}`}
                      onClick={handleCopyPrompt}
                      title="Copy prompt to clipboard"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  id="admin-exam-json"
                  spellCheck={false}
                  className="json-textarea side-textarea"
                  placeholder={`{\n  "title": "Full Form MCQ — Part 1 (Simple)",\n  "durationMinutes": 30,\n  "questions": [\n    {\n      "question_number": 1,\n      "question_english": "What is the full form of CPU?",\n      "question_hindi": "CPU का पूर्ण रूप क्या है?",\n      "options": [\n        { "option_label": "a", "option_text_english": "Central Processing Unit", "option_text_hindi": "सेंट्रल प्रोसेसिंग यूनिट" }\n      ],\n      "correct_option_label": "a"\n    }\n  ]\n}`}
                  value={jsonInput}
                  onChange={(e) => handleJsonChange(e.target.value)}
                />
              </div>
            </div>

            {/* Live Inspection Card */}
            {livePreview && livePreview.valid && (
              <div className="live-preview-box">
                <div className="preview-item">
                  <span className="preview-label">Exam Name</span>
                  <strong>{examTitle || livePreview.title}</strong>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Total Questions</span>
                  <strong>{livePreview.questionCount} Questions</strong>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Duration</span>
                  <strong>{examDuration || livePreview.durationMinutes} Minutes</strong>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Languages</span>
                  <span className={`badge ${livePreview.isBilingual ? 'badge-success' : 'badge-neutral'}`}>
                    {livePreview.isBilingual ? 'Bilingual (Hindi + English)' : 'Monolingual'}
                  </span>
                </div>
              </div>
            )}

            <div className="admin-import-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClearAll}
                disabled={(!jsonInput && !examTitle && !uploadedFileName) || isSaving}
              >
                Clear All
              </button>
              <button
                type="button"
                className="btn-primary btn-deploy"
                disabled={!jsonInput.trim() || isSaving}
                onClick={handleDeployExam}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-small" />
                    <span>Deploying to Firebase...</span>
                  </>
                ) : (
                  <>
                    <Database size={16} />
                    <span>Save &amp; Deploy to Firebase</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE EXAM SETS */}
        {activeTab === 'exams' && (
          <div className="admin-tab-content">
            <div className="manage-exams-header">
              <div>
                <h3>All Available Exam Sets</h3>
                <p>Manage built-in mock papers and exams deployed to Firebase Cloud Storage &amp; Firestore.</p>
              </div>
              <button
                type="button"
                className="btn-primary-small"
                onClick={() => setActiveTab('import')}
              >
                <UploadCloud size={14} />
                <span>Import New Paper</span>
              </button>
            </div>

            {/* Filter toolbar */}
            <div className="manage-filter-toolbar">
              <div className="manage-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search exam sets by title or ID..."
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                />
                {manageSearch && (
                  <button type="button" onClick={() => setManageSearch('')}>&times;</button>
                )}
              </div>

              <div className="manage-category-filter">
                <select
                  value={manageCategoryFilter}
                  onChange={(e) => setManageCategoryFilter(e.target.value)}
                >
                  <option value="all">All Streams</option>
                  {EXAM_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="custom">Custom / General</option>
                </select>
              </div>
            </div>

            <div className="admin-exams-table-wrapper">
              <table className="admin-exams-table">
                <thead>
                  <tr>
                    <th>Exam Title</th>
                    <th>Category</th>
                    <th>Questions</th>
                    <th>Duration</th>
                    <th>Storage Source</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.map((examItem) => {
                    const catObj = EXAM_CATEGORIES.find(c => c.id === examItem.category);

                    return (
                      <tr key={examItem.id}>
                        <td>
                          <div className="exam-title-cell">
                            <strong>{examItem.title}</strong>
                            <span className="exam-id-sub">ID: {examItem.id}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge category-tag">
                            {catObj?.shortName || examItem.category || 'General'}
                          </span>
                        </td>
                        <td>{examItem.questions?.length || 0} Qs</td>
                        <td>{examItem.durationMinutes || 60} mins</td>
                        <td>
                          <span className="badge badge-firebase" title="Stored in Firebase Cloud Storage & Firestore">
                            <HardDrive size={12} />
                            <span>Firebase Storage</span>
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            <button
                              type="button"
                              className="btn-action-icon preview-btn"
                              title="Preview exam in simulator"
                              onClick={() => window.open(`/exam/${examItem.id}`, '_blank')}
                            >
                              <PlayCircle size={16} />
                            </button>
                            <button
                              type="button"
                              className="btn-action-icon download-btn"
                              title="Download question paper JSON file"
                              onClick={() => handleDownloadExam(examItem)}
                            >
                              <Download size={16} />
                            </button>
                            {examItem.storageUrl && (
                              <a
                                href={examItem.storageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-action-icon storage-link-btn"
                                title="Open Firebase Storage download URL"
                              >
                                <ExternalLink size={16} />
                              </a>
                            )}
                            <button
                              type="button"
                              className="btn-action-icon delete-btn"
                              title="Delete exam from Firebase Storage & Firestore"
                              onClick={() => handleDeleteExam(examItem.id, examItem.title)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredExams.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                        No exam sets matching your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: FIREBASE SETTINGS & SECURITY RULES */}
        {activeTab === 'settings' && (
          <div className="admin-tab-content">
            <div className="settings-header">
              <h3>Firebase Backend &amp; Cloud Storage Configuration</h3>
              <p>Verify your Firebase Project ID, Authentication, Cloud Firestore, and Storage Bucket.</p>
            </div>

            <div className="settings-status-card">
              <div className="status-grid">
                <div className="status-item">
                  <span className="status-item-label">Status</span>
                  <span className={`status-badge ${isConfigured ? 'connected' : 'disconnected'}`}>
                    {isConfigured ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-item-label">Project ID</span>
                  <span className="status-item-value">{firebaseConfig?.projectId || 'Not set'}</span>
                </div>
                <div className="status-item">
                  <span className="status-item-label">Storage Bucket</span>
                  <span className="status-item-value">{firebaseConfig?.storageBucket || 'Not set'}</span>
                </div>
                <div className="status-item">
                  <span className="status-item-label">Auth Domain</span>
                  <span className="status-item-value">{firebaseConfig?.authDomain || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="firebase-plan-note-card">
              <div className="plan-badge-tag">100% Free Plan (Spark)</div>
              <h4>No Credit Card or Paid Plan Required</h4>
              <p>
                Firebase Cloud Firestore Database is 100% free (1 GB storage, 50,000 reads/day). All exam question papers, bilingual texts, and multiline step-by-step explanations are saved directly into Firestore. You do <strong>not</strong> need to upgrade to the Blaze plan to use this portal!
              </p>
            </div>

            {/* Security Rules Reference Section */}
            <div className="rules-section-grid">
              <div className="rules-card">
                <div className="rules-card-header">
                  <div>
                    <strong>Cloud Storage Rules</strong>
                    <p>Allows anyone to read question papers, authenticated admins to upload.</p>
                  </div>
                  <button
                    type="button"
                    className="btn-sample btn-sample-copy"
                    onClick={() => copyToClipboard(storageRulesSnippet, setCopiedStorageRules)}
                  >
                    {copiedStorageRules ? <CheckCheck size={14} /> : <Copy size={14} />}
                    <span>{copiedStorageRules ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="rules-code">{storageRulesSnippet}</pre>
              </div>

              <div className="rules-card">
                <div className="rules-card-header">
                  <div>
                    <strong>Firestore Database Rules</strong>
                    <p>Allows anyone to view available exams, authenticated admins to update.</p>
                  </div>
                  <button
                    type="button"
                    className="btn-sample btn-sample-copy"
                    onClick={() => copyToClipboard(firestoreRulesSnippet, setCopiedRules)}
                  >
                    {copiedRules ? <CheckCheck size={14} /> : <Copy size={14} />}
                    <span>{copiedRules ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="rules-code">{firestoreRulesSnippet}</pre>
              </div>
            </div>

            {settingsSuccess && (
              <div role="status" className="alert success-alert admin-alert">
                <CheckCircle2 size={18} />
                <span>{settingsSuccess}</span>
              </div>
            )}

            <div className="config-form-section">
              <h4>Update Firebase Configuration Live</h4>
              <p>Paste new Firebase web configuration JSON below to switch projects or credentials live.</p>
              <form onSubmit={handleSaveSettings}>
                <textarea
                  className="config-textarea admin-textarea"
                  rows={6}
                  placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-app.firebaseapp.com",\n  "projectId": "your-app",\n  "storageBucket": "your-app.appspot.com",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                  value={settingsConfigInput}
                  onChange={(e) => setSettingsConfigInput(e.target.value)}
                />
                <div className="settings-action-row">
                  {firebaseConfig && (
                    <button
                      type="button"
                      className="btn-danger-outline"
                      onClick={() => {
                        removeCustomConfig();
                        setSettingsSuccess('Reset configuration to default .env environment.');
                      }}
                    >
                      Reset to .env Defaults
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn-primary-small"
                    disabled={!settingsConfigInput.trim()}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* AI Prompt Modal */}
      {showPromptModal && (
        <div className="prompt-modal-overlay" onClick={() => setShowPromptModal(false)}>
          <div className="prompt-modal-card" ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <div className="prompt-modal-header">
              <div>
                <h3>
                  <Camera size={20} className="icon-gold" />
                  <span>AI Prompt for Question Photos</span>
                </h3>
                <p>Use this prompt in ChatGPT, Claude, or Gemini along with question photos. AI will transcribe, automatically translate, and structure step-by-step multiline explanations.</p>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setShowPromptModal(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="prompt-modal-body">
              <div className="prompt-steps-grid">
                <div className="prompt-step-box">
                  <span className="step-num">Step 1</span>
                  <span className="step-text">Click "Copy AI Prompt" below</span>
                </div>
                <div className="prompt-step-box">
                  <span className="step-num">Step 2</span>
                  <span className="step-text">Open ChatGPT / Gemini, attach your photo &amp; paste this prompt</span>
                </div>
                <div className="prompt-step-box">
                  <span className="step-num">Step 3</span>
                  <span className="step-text">Upload or paste the generated JSON and click "Save &amp; Deploy to Firebase Storage"</span>
                </div>
              </div>

              <div className="prompt-code-container">
                <pre className="prompt-code-text">{AI_IMAGE_OCR_PROMPT}</pre>
              </div>
            </div>

            <div className="prompt-modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowPromptModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className={`btn-copy-prompt ${copied ? 'copied' : ''}`}
                onClick={handleCopyPrompt}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy AI Prompt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;
