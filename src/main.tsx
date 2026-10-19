import { StrictMode, Component } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { startPersistence, useStore } from './store';
// Snapchat's UI font is Avenir Next (built into iOS/macOS); Nunito Sans is the bundled look-alike
// for Windows/Android so it never depends on a CDN.
import '@fontsource/nunito-sans/400.css';
import '@fontsource/nunito-sans/500.css';
import '@fontsource/nunito-sans/600.css';
import '@fontsource/nunito-sans/700.css';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ position: 'fixed', inset: 0, padding: 24, paddingTop: 80, color: '#fff', background: '#121212', fontFamily: 'system-ui' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Etwas ist schiefgelaufen</h2>
        <p style={{ color: '#aaa', margin: '12px 0' }}>{this.state.error.message}</p>
        <button
          style={{ background: '#FFFC00', color: '#000', borderRadius: 999, padding: '10px 18px', fontWeight: 700 }}
          onClick={() => location.reload()}
        >
          Neu laden
        </button>
      </div>
    );
  }
}

startPersistence();
useStore.getState().init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW registration failed', e));
  });
}
