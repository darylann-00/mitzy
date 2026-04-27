import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { cleanupOldKeys } from './utils/storage';

if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  const favicon = document.getElementById('favicon');
  if (favicon) favicon.href = '/favicon-local.svg';
  document.title = 'Mitzy (local)';
}

cleanupOldKeys();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
