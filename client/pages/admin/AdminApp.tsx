import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  isMasterAdmin: boolean;
  permissions: any;
}

export function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing admin session
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const savedUser = localStorage.getItem('adminUser');

      console.log('Checking admin auth status...', { hasToken: !!token, hasUser: !!savedUser });

      if (token && savedUser) {
        // Verify token with server
        console.log('Verifying admin token...');
        const response = await fetch('/api/admin/verify-session', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          credentials: 'same-origin'
        });

        console.log('Auth verification response:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Auth verification successful for:', data.user.email);
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          console.warn('Auth verification failed, clearing tokens');
          // Token is invalid, clear storage
          handleLogout();
        }
      } else {
        console.log('No admin token found, user needs to login');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token: string, userData: AdminUser) => {
    console.log('Admin login handler called for:', userData.email);
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    console.log('Admin logout handler called');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Initializing admin interface...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/admin" 
          element={<Navigate to="/admin/dashboard" replace />} 
        />
        <Route 
          path="/admin/dashboard" 
          element={<AdminDashboard user={user} onLogout={handleLogout} />} 
        />
        <Route 
          path="/admin/*" 
          element={<Navigate to="/admin/dashboard" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default AdminApp;
