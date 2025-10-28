
// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx'; // <-- IMPORT

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>  {/* <-- ADD */}
      <AuthProvider> {/* <-- ADD */}
        <App />
      </AuthProvider> {/* <-- ADD */}
    </BrowserRouter> {/* <-- ADD */}
  </React.StrictMode>
);