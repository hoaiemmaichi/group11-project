import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

// Protects routes — redirects to / (home) or /login when not authenticated.
// Props: requiredRole (optional) e.g. 'admin'
export default function ProtectedRoute({ requiredRole }) {
  const auth = useSelector(state => state.auth);
  const token = auth?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const user = auth?.user || (() => { try { const r = localStorage.getItem('currentUser'); return r ? JSON.parse(r) : null; } catch(e) { return null; } })();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
