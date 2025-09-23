import React from 'react';

// Simple vanilla JS admin login for testing
export function AdminLoginSimple() {
  const handleLogin = () => {
    const email = (document.getElementById('admin-email') as HTMLInputElement)?.value || '';
    const password = (document.getElementById('admin-password') as HTMLInputElement)?.value || '';
    const adminCode = (document.getElementById('admin-code') as HTMLInputElement)?.value || '';
    
    if (!email || !password || !adminCode) {
      alert('Please fill in all fields');
      return;
    }
    
    console.log('🔐 Simple login attempt:', { email, hasPassword: !!password, hasAdminCode: !!adminCode });
    
    // Use vanilla fetch without React complications
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/login', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    
    xhr.onload = function() {
      console.log('📡 XHR Status:', xhr.status);
      console.log('📡 XHR Response:', xhr.responseText);
      
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.success) {
            alert('Login successful! Token: ' + data.token.substring(0, 20) + '...');
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user));
            window.location.href = '/admin/dashboard';
          } else {
            alert('Login failed: ' + (data.error || 'Unknown error'));
          }
        } catch (error) {
          console.error('Parse error:', error);
          alert('Invalid response from server');
        }
      } else {
        alert(`Request failed with status: ${xhr.status}\nResponse: ${xhr.responseText}`);
      }
    };
    
    xhr.onerror = function() {
      alert('Network error occurred');
    };
    
    xhr.send(JSON.stringify({ email, password, adminCode }));
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom right, #1e293b, #7c3aed, #1e293b)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#1e293b',
        borderRadius: '8px',
        padding: '2rem',
        border: '1px solid #475569'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#dc2626',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            color: 'white',
            fontSize: '24px'
          }}>
            🛡️
          </div>
          <h1 style={{ color: 'white', fontSize: '1.875rem', fontWeight: 'bold', margin: '0 0 0.5rem' }}>
            Simple Admin Login
          </h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>
            Vanilla JS test for debugging
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#cbd5e1', display: 'block', marginBottom: '0.5rem' }}>
            Admin Email
          </label>
          <input
            id="admin-email"
            type="email"
            placeholder="admin@apprenticeapex.com"
            defaultValue="admin@apprenticeapex.com"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#475569',
              border: '1px solid #64748b',
              borderRadius: '4px',
              color: 'white',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#cbd5e1', display: 'block', marginBottom: '0.5rem' }}>
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            placeholder="Enter admin password"
            defaultValue="MasterAdmin2024!"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#475569',
              border: '1px solid #64748b',
              borderRadius: '4px',
              color: 'white',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: '#cbd5e1', display: 'block', marginBottom: '0.5rem' }}>
            Admin Access Code
          </label>
          <input
            id="admin-code"
            type="password"
            placeholder="Enter admin access code"
            defaultValue="APEX2024"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#475569',
              border: '1px solid #64748b',
              borderRadius: '4px',
              color: 'white',
              fontSize: '1rem'
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#dc2626',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🛡️ Access Admin Panel
        </button>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>
            This is a simplified test page to debug body stream issues.
            Check browser console for detailed logs.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginSimple;
