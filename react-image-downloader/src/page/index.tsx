import React from 'react';
import ReactDOM from 'react-dom/client';
import { Page } from './Page';
import * as Sentry from '@sentry/react';
import './index.css';

// Инициализация Sentry
Sentry.init({
  dsn: 'https://815c4402aa7d273adbb56965901ea6d0@o4508841814130688.ingest.de.sentry.io/4509021769039952',
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  environment: 'production',
  release: 'image-downloader@3.0.0',
  debug: true,
});

// Рендерим React-приложение
ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
); 