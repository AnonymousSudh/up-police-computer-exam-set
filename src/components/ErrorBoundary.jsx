import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('Application error:', error); }
  render() {
    if (this.state.failed) return <main className="main-content"><div className="empty-state" role="alert"><h1>Something went wrong</h1><p>Reload to try again. Your saved exams remain in this browser.</p><button className="btn-primary" onClick={() => window.location.reload()}>Reload page</button></div></main>;
    return this.props.children;
  }
}
