import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

class DlavieErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return <div className="empty"><div className="glass bento-card"><h1>DlavieOS memulihkan workspace</h1><p>{this.state.error.message}</p><button className="send" onClick={() => location.reload()}>Muat ulang</button></div></div>;
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(<React.StrictMode><DlavieErrorBoundary><App /></DlavieErrorBoundary></React.StrictMode>);
