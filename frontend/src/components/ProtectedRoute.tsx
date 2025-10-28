import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { token } = useAuth();

  if (!token) {
    // If no token, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  // If there is a token, render the child component (AdminDashboard)
  return <Outlet />;
};

export default ProtectedRoute;
