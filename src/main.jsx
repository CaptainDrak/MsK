import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', background: '#fffbeb' }}>
          <div style={{ maxWidth: 480, padding: 32, background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
            <h2 style={{ margin: '0 0 8px', color: '#1f2937' }}>Something went wrong</h2>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>The app ran into an unexpected error.</p>
            <details style={{ textAlign: 'left', marginBottom: 24, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
              <summary style={{ cursor: 'pointer', color: '#dc2626', fontSize: 14 }}>Error details</summary>
              <pre style={{ color: '#dc2626', whiteSpace: 'pre-wrap', fontSize: 13, marginTop: 8 }}>{this.state.error.message}</pre>
            </details>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload() }}
              style={{ background: '#92400e', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}
            >
              Reload app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
