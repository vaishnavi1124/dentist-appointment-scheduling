
// frontend/src/components/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('vaishnavi110204@gmail.com'); // Pre-filled for demo
  const [password, setPassword] = useState('••••••'); // Masked for demo
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await fetch('http://localhost:8000/admin/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Incorrect email or password.');
        } else {
          setError('An error occurred. Please try again.');
        }
        throw new Error('Failed to login');
      }

      const data = await response.json();
      login(data.access_token);
      navigate('/admin');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          setError('Failed to fetch: Cannot connect to server. Is it running?');
        } else if (!error) {
          setError(err.message);
        }
      } else {
        setError('An unknown error occurred.');
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        color: '#fff',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          zIndex: 10,
        }}
      >
        <a
          href="/"
          style={{
            color: '#ff6bff',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ← Back to Home
        </a>
        <h1 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>Admin Panel</h1>
      </div>

      {/* Login Card */}
      <div
        style={{
          background: 'rgba(30, 30, 50, 0.7)',
          backdropFilter: 'blur(15px)',
          borderRadius: '20px',
          padding: '40px 30px',
          width: '100%',
          maxWidth: '380px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h2
          style={{
            textAlign: 'center',
            margin: '0 0 30px 0',
            fontSize: '28px',
            fontWeight: '600',
            color: '#fff',
          }}
        >
          Admin Login
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#ccc',
              }}
            >
              Email (as username)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '16px',
                background: '#fff',
                border: 'none',
                borderRadius: '12px',
                outline: 'none',
                boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.05)',
                color: '#333',
              }}
              placeholder="vaishnavi110204@gmail.com"
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '25px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                color: '#ccc',
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '16px',
                background: '#fff',
                border: 'none',
                borderRadius: '12px',
                outline: 'none',
                boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.05)',
                color: '#333',
              }}
              placeholder="••••••"
            />
          </div>

          {/* Error Message */}
          {error && (
            <p
              style={{
                color: '#ff6b6b',
                fontSize: '14px',
                textAlign: 'center',
                margin: '0 0 15px 0',
                background: 'rgba(255, 107, 107, 0.1)',
                padding: '8px',
                borderRadius: '8px',
              }}
            >
              {error}
            </p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#fff',
              background: 'linear-gradient(90deg, #ff6bff, #6b48ff)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(107, 72, 255, 0.4)',
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.boxShadow = '0 6px 20px rgba(107, 72, 255, 0.6)')
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.boxShadow = '0 4px 15px rgba(107, 72, 255, 0.4)')
            }
          >
            Login
          </button>
        </form>
      </div>

     
    </div>
  );
};

export default Login;