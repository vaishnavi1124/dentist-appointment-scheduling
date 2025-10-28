// src/context/AuthContext.tsx

import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';

// Define the shape of the context data
interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Get the token from local storage, or null if it doesn't exist
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('authToken');
  });

  // Function to save the token on login
  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
  };

  // Function to remove the token on logout
  const logout = () => {
    setToken(null);
    localStorage.removeItem('authToken');
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    token,
    login,
    logout
  }), [token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to easily use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};