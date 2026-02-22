
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Suppress "The user aborted a request" and "signal is aborted without reason" errors
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.name === 'AbortError' || 
    event.reason?.message?.includes('aborted') ||
    event.reason?.message?.includes('The user aborted a request')
  ) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  if (
    event.error?.name === 'AbortError' || 
    event.message?.includes('aborted') ||
    event.message?.includes('The user aborted a request')
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
