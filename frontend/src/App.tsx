
// frontend/src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/Home';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#1A1E2E] via-[#2A3048] to-[#1A1E2E]">
      <Navbar />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;

