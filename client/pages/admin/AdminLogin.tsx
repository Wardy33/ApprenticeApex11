import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (token: string, user: any) => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const navigate = useNavigate();
  
  // Use ref to prevent duplicate submissions
  const isSubmittingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Check if already logged in as admin
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const token = localStorage.getItem('adminToken');
    if (token) {
      console.log('🔍 Existing admin token found, verifying...');
      verifyAdminSession(token);
    }
  }, []);

  const verifyAdminSession = async (token: string) => {
    try {
      console.log('🔍 Verifying admin session...');
      
      const result = await makeSecureRequest('/api/admin/verify-session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (result.success && result.data) {
        console.log('✅ Session verified successfully for:', result.data.user.email);
        onLogin(token, result.data.user);
        navigate('/admin/dashboard');
      } else {
        console.warn('⚠️ Session verification failed, clearing tokens');
        clearAdminSession();
      }
    } catch (error) {
      console.error('❌ Session verification error:', error);
      clearAdminSession();
    }
  };

  const clearAdminSession = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  // Secure request function that handles the body stream issue
  interface XhrResult<T = any> {
    success: boolean;
    status: number;
    data: T | null;
    text: string;
  }

  const makeSecureRequest = async <T = any>(url: string, options: any = {}): Promise<XhrResult<T>> => {
    return new Promise<XhrResult<T>>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open(options.method || 'GET', url, true);
      
      // Set headers
      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          xhr.setRequestHeader(key, options.headers[key]);
        });
      }
      
      // Set timeout
      xhr.timeout = 15000; // 15 seconds
      
      xhr.onload = function() {
        try {
          const responseText = xhr.responseText;
          console.log(`📡 XHR Response [${xhr.status}]:`, responseText.substring(0, 200));
          
          let data: T | null = null;
          if (responseText) {
            try {
              data = JSON.parse(responseText);
            } catch (parseError) {
              console.error('❌ JSON parse error:', parseError);
              reject(new Error('Invalid JSON response from server'));
              return;
            }
          }
          
          resolve({
            success: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            data: data,
            text: responseText
          });
        } catch (error) {
          reject(error);
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network connection failed'));
      };
      
      xhr.ontimeout = function() {
        reject(new Error('Request timeout after 15 seconds'));
      };
      
      xhr.onabort = function() {
        reject(new Error('Request was aborted'));
      };
      
      // Send request
      try {
        if (options.body) {
          xhr.send(options.body);
        } else {
          xhr.send();
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent duplicate submissions
    if (isSubmittingRef.current || loading) {
      console.log('🚫 Submission already in progress, ignoring...');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError('');

    // Validate inputs
    if (!email.trim() || !password || !adminCode.trim()) {
      setError('All fields are required');
      setLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    const requestBody = JSON.stringify({
      email: email.trim(),
      password,
      adminCode: adminCode.trim()
    });

    console.log('🔐 Starting admin login attempt:', { 
      email: email.trim(), 
      hasPassword: !!password, 
      hasAdminCode: !!adminCode.trim() 
    });

    try {
      console.log('🔐 Sending login request using XHR...');
      
      const result = await makeSecureRequest('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: requestBody
      });

      console.log('🔐 Login response received:', { 
        success: result.success, 
        status: result.status, 
        hasData: !!result.data 
      });

      if (result.success && result.data && result.data.success) {
        console.log('✅ Admin login successful!');
        
        // Store admin credentials
        localStorage.setItem('adminToken', result.data.token);
        localStorage.setItem('adminUser', JSON.stringify(result.data.user));
        
        // Call parent login handler
        onLogin(result.data.token, result.data.user);
        
        // Reset form
        setEmail('');
        setPassword('');
        setAdminCode('');
        setLoginAttempts(0);
        
        console.log('🔐 Navigating to admin dashboard...');
        navigate('/admin/dashboard');
        
      } else {
        // Handle login failure
        const errorMessage = result.data?.error || `Login failed (Status: ${result.status})`;
        const errorCode = result.data?.code || 'UNKNOWN_ERROR';
        
        console.warn('❌ Admin login failed:', errorMessage, errorCode);
        setError(errorMessage);
        setLoginAttempts(prev => prev + 1);
        
        // Clear sensitive fields on specific errors
        if (errorCode === 'INVALID_ADMIN_CODE') {
          setAdminCode('');
        }
        if (errorCode === 'INVALID_ADMIN_CREDENTIALS') {
          setPassword('');
        }
      }

    } catch (error) {
      console.error('❌ Login request failed:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      const errMsg = error instanceof Error ? error.message : '';
      
      if (errMsg.includes('timeout')) {
        errorMessage = 'Request timeout. Please check your connection and try again.';
      } else if (errMsg.includes('Network')) {
        errorMessage = 'Network connection error. Please check your connection.';
      } else if (errMsg.includes('JSON')) {
        errorMessage = 'Server communication error. Please try again.';
      } else if (errMsg) {
        errorMessage = errMsg;
      }
      
      setError(errorMessage);
      setLoginAttempts(prev => prev + 1);
      
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const isFormValid = email.trim() && password && adminCode.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom right, rgb(15 23 42), rgb(88 28 135), rgb(15 23 42))' }}>
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Master Admin</h1>
            <p className="text-slate-400 mt-2">ApprenticeApex Platform Administration</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Secure Admin Access
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your master admin credentials to access the platform dashboard
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Login Attempts Warning */}
              {loginAttempts >= 2 && (
                <Alert className="bg-amber-900/50 border-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-amber-200">
                    {loginAttempts >= 3 ? 
                      'Account may be locked after failed attempts. Please contact system administrator.' :
                      `${3 - loginAttempts} attempt(s) remaining before account lock.`
                    }
                  </AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@apprenticeapex.com"
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:text-slate-100"
                  style={{ color: '#f1f5f9' }}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 pr-10 focus:text-slate-100"
                    style={{ color: '#f1f5f9' }}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Admin Access Code */}
              <div className="space-y-2">
                <Label htmlFor="adminCode" className="text-slate-300">Admin Access Code</Label>
                <Input
                  id="adminCode"
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Enter admin access code"
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:text-slate-100"
                  style={{ color: '#f1f5f9' }}
                  required
                  disabled={loading}
                  autoComplete="off"
                />
                <p className="text-xs text-slate-500">
                  Additional security layer required for admin access
                </p>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                disabled={!isFormValid || loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Access Admin Panel
                  </div>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Security Notice */}
        <div className="text-center space-y-2">
          <p className="text-xs text-slate-500">
            This is a secure administrative interface. All access is logged and monitored.
          </p>
          <p className="text-xs text-slate-600">
            Unauthorized access is prohibited and may result in legal action.
          </p>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-center">
            <p className="text-xs text-slate-600">
              Debug: Using XHR for request handling to avoid body stream issues
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLogin;
