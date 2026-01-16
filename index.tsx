
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const init = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Root element not found, retrying...");
    // Se non lo trova subito, aspetta un attimo (utile per alcune configurazioni di Vercel)
    setTimeout(init, 100);
    return;
  }

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
