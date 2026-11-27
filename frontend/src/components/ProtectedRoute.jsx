import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ token, currentUser, requiredRole }) {
  if (!token || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    // If employee tries accessing admin route, redirect to employee dashboard
    if (currentUser.role === 'employee') {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  return <Outlet />;
}
