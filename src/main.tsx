import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

// Suppress Vite HMR WebSocket connection errors in sandbox/proxy environments
window.addEventListener('unhandledrejection', (event) => {
  const msg = event?.reason?.message || String(event?.reason || '');
  if (msg.includes('WebSocket') || msg.includes('websocket')) {
    event.preventDefault();
  }
});

// Register Service Worker for offline PWA functionality (when supported and outside iframe sandbox)
if ('serviceWorker' in navigator && typeof window !== 'undefined' && window.self === window.top) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch(() => {
        // Gracefully ignore in non-PWA/restricted environments without console warning
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
