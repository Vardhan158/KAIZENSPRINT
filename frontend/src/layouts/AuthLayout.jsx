import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen cinematic-bg flex items-center justify-center p-6">
      <Outlet />
    </div>
  );
}
