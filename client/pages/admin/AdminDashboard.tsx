import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Activity,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  FileText,
  Download
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  isMasterAdmin: boolean;
  permissions: any;
}

interface DashboardStats {
  platformStats: {
    totalUsers: number;
    totalStudents: number;
    totalCompanies: number;
    totalApplications: number;
    totalJobPostings: number;
    totalInterviews: number;
    activeSubscriptions: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  growthMetrics: {
    usersThisWeek: number;
    usersThisMonth: number;
    applicationsThisWeek: number;
    revenueThisMonth: number;
    subscriptionsThisMonth: number;
  };
  systemHealth: {
    errorRate: number;
    averageResponseTime: number;
    uptime: number;
    activeConnections: number;
    databaseStatus: string;
  };
  lastUpdated: string;
}

interface AdminDashboardProps {
  user: AdminUser;
  onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        onLogout();
        return;
      }

      const response = await fetch('/api/admin/dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastRefresh(new Date());
        setError('');
      } else if (response.status === 401 || response.status === 403) {
        onLogout();
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard data error:', error);
      setError('Network error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-GB').format(num);
  };

  const getHealthStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500 text-white">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Disconnected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-red-600" />
                <h1 className="text-xl font-bold text-gray-900">Master Admin Dashboard</h1>
              </div>
              <Badge variant="outline" className="border-red-200 text-red-700">
                {user.role === 'master_admin' ? 'Master Admin' : 'Admin'}
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <Activity className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {stats && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.platformStats.totalUsers)}</div>
                    <p className="text-xs text-muted-foreground">
                      +{stats.growthMetrics.usersThisWeek} this week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(stats.platformStats.totalCompanies)}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.platformStats.activeSubscriptions} with subscriptions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.platformStats.monthlyRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      Total: {formatCurrency(stats.platformStats.totalRevenue)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Health</CardTitle>
                    <Activity className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.systemHealth.uptime.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.systemHealth.averageResponseTime}ms avg response
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Growth Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Growth</CardTitle>
                    <CardDescription>User registration and engagement metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Students</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatNumber(stats.platformStats.totalStudents)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Companies</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatNumber(stats.platformStats.totalCompanies)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">This Month</span>
                        <span className="text-lg font-semibold text-purple-600">
                          +{formatNumber(stats.growthMetrics.usersThisMonth)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>Current platform health and performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Database</span>
                        {getHealthStatusBadge(stats.systemHealth.databaseStatus)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Error Rate</span>
                        <Badge variant={stats.systemHealth.errorRate < 0.05 ? "default" : "destructive"}>
                          {(stats.systemHealth.errorRate * 100).toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Active Connections</span>
                        <span className="font-semibold">{formatNumber(stats.systemHealth.activeConnections)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Users
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      View Reports
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      System Settings
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Database className="w-4 h-4 mr-2" />
                      Database Health
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage platform users and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">User management interface will be implemented here.</p>
                  <div className="mt-4">
                    <Button>View All Users</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Analytics</CardTitle>
                  <CardDescription>Revenue, subscriptions, and payment analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Financial analytics interface will be implemented here.</p>
                  <div className="mt-4">
                    <Button>View Financial Reports</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Tab */}
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>System Monitoring</CardTitle>
                  <CardDescription>Platform health, logs, and performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">System monitoring interface will be implemented here.</p>
                  <div className="mt-4">
                    <Button>View System Logs</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Configuration</CardTitle>
                  <CardDescription>System settings, feature flags, and platform configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Platform configuration interface will be implemented here.</p>
                  <div className="mt-4">
                    <Button>Manage Settings</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
