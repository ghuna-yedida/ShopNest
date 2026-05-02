/**
 * main.jsx — React Entry Point
 *
 * This is the first JavaScript file that runs in your browser.
 * It finds the <div id="root"> in index.html and "mounts" the React app inside it.
 *
 * React.StrictMode: WHY?
 * In development, React intentionally calls your components and effects TWICE
 * to help you catch bugs that happen when components mount → unmount → remount
 * (like cleanup functions you forgot to write, or stale closures).
 * StrictMode has ZERO effect in production — it's a dev tool only.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
