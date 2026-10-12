import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress Vite HMR WebSocket connection errors in sandbox/proxy environments
window.addEventListener('unhandledrejection', (event) => {
  const msg = event?.reason?.message || String(event?.reason || '');
  if (msg.includes('WebSocket') || msg.includes('websocket')) {
    event.preventDefault();
  }
});

// Register Service Worker for offline PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        console.log('StudyMind ServiceWorker active:', reg.scope);
      })
      .catch((err) => {
        console.warn('StudyMind ServiceWorker registration skipped:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
