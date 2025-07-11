import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('app-root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    // <React.StrictMode> // Removed StrictMode
      <App />
    // </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element with ID 'app-root'");
}