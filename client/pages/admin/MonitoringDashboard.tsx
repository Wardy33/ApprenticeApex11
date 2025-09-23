import React, { useState, useEffect } from 'react';
import { safeGetFromLocalStorage } from '../../lib/safeJsonParse';
import {
  AlertTriangle,
  Shield,
  Eye,
  Activity,
  TrendingUp,
  Users,
  Clock,
  Flag,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { WebLayout } from '../../components/WebLayout';

interface MonitoringStats {
  totalFlags: number;
  criticalFlags: number;
  highFlags: number;
  resolvedFlags: number;
}

interface SuspiciousActivity {
  id: string;
  employerId: string;
  studentId: string;
  activityType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  status: 'flagged' | 'reviewed' | 'resolved' | 'escalated';
  evidence: any;
}

export default function MonitoringDashboard() {
  const [stats, setStats] = useState<MonitoringStats>({
    totalFlags: 0,
    criticalFlags: 0,
    highFlags: 0,
    resolvedFlags: 0
  });
  
  const [activities, setActivities] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    severity: 'all',
    status: 'all',
    timeWindow: '24h'
  });

  useEffect(() => {
    loadMonitoringData();
  }, [filter]);

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      // Fetch alert statistics
      const statsResponse = await fetch('/api/alerts/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      // Fetch active alerts
      const alertsResponse = await fetch('/api/alerts/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      if (statsResponse.ok && alertsResponse.ok) {
        const statsData = await statsResponse.json();
        const alertsData = await alertsResponse.json();

        if (statsData.success) {
          setStats({
            totalFlags: statsData.stats.active.total,
            criticalFlags: statsData.stats.active.critical,
            highFlags: statsData.stats.active.high,
            resolvedFlags: 0 // Would need separate endpoint for resolved count
          });
        }

        if (alertsData.success) {
          // Convert alerts to activities format
          const convertedActivities = alertsData.alerts.map((alert: any) => ({
            id: alert.id,
            employerId: alert.employerId || 'unknown',
            studentId: alert.studentId || 'unknown',
            activityType: alert.data?.activityType || alert.title,
            severity: alert.severity,
            description: alert.message || alert.title,
            timestamp: new Date(alert.createdAt),
            status: alert.status,
            evidence: alert.data?.evidence || alert.data
          }));
          setActivities(convertedActivities);
        }
      } else {
        // Set empty state if API fails
        const emptyStats = {
          totalFlags: 0,
          criticalFlags: 0,
          highFlags: 0,
          resolvedFlags: 0
        };

        setStats(emptyStats);
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'text-red-500 bg-red-500/10 border-red-500/30',
      high: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
      medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
      low: 'text-blue-500 bg-blue-500/10 border-blue-500/30'
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      flagged: 'text-red-400 bg-red-400/10',
      reviewed: 'text-yellow-400 bg-yellow-400/10',
      resolved: 'text-green-400 bg-green-400/10',
      escalated: 'text-purple-400 bg-purple-400/10'
    };
    return colors[status as keyof typeof colors] || colors.flagged;
  };

  const handleStatusUpdate = async (activityId: string, newStatus: string) => {
    try {
      if (newStatus === 'acknowledged') {
        const response = await fetch(`/api/alerts/${activityId}/acknowledge`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setActivities(prev =>
            prev.map(activity =>
              activity.id === activityId
                ? { ...activity, status: 'acknowledged' as any }
                : activity
            )
          );
        }
      } else if (newStatus === 'resolved') {
        // For resolved status, we'd need a resolution modal
        const resolution = prompt('Enter resolution details:');
        if (resolution) {
          const response = await fetch(`/api/alerts/${activityId}/resolve`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ resolution })
          });

          if (response.ok) {
            setActivities(prev =>
              prev.map(activity =>
                activity.id === activityId
                  ? { ...activity, status: 'resolved' as any }
                  : activity
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error updating alert status:', error);
    }
  };

  const handleTestAlert = async () => {
    try {
      const response = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'monitoring', severity: 'medium' })
      });

      if (response.ok) {
        alert('Test alert triggered successfully!');
        loadMonitoringData(); // Refresh data
      }
    } catch (error) {
      console.error('Error triggering test alert:', error);
    }
  };

  return (
    <WebLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Shield className="h-8 w-8 text-orange mr-3" />
              Anti-Poaching Monitoring
            </h1>
            <p className="text-gray-400 mt-2">
              Real-time monitoring of employer behavior and platform compliance
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={loadMonitoringData}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 bg-orange hover:bg-orange/90 text-white px-4 py-2 rounded-lg">
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Flags</p>
                <p className="text-2xl font-bold text-white">{stats.totalFlags}</p>
              </div>
              <Flag className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-500">{stats.criticalFlags}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">High Priority</p>
                <p className="text-2xl font-bold text-orange-500">{stats.highFlags}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Resolved</p>
                <p className="text-2xl font-bold text-green-500">{stats.resolvedFlags}</p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Filters:</span>
            </div>

            <select
              value={filter.severity}
              onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value }))}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="flagged">Flagged</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>

            <select
              value={filter.timeWindow}
              onChange={(e) => setFilter(prev => ({ ...prev, timeWindow: e.target.value }))}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-gray-900 rounded-xl border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Activity className="h-5 w-5 text-orange mr-2" />
              Suspicious Activities
            </h2>
          </div>

          <div className="divide-y divide-gray-700">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                Loading monitoring data...
              </div>
            ) : activities.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Shield className="h-8 w-8 mx-auto mb-4 opacity-50" />
                No suspicious activities detected
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(activity.severity)}`}>
                          {activity.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <h3 className="text-white font-semibold mb-1">
                        {activity.activityType.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-gray-300 text-sm mb-2">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Employer: {activity.employerId}</span>
                        <span>Student: {activity.studentId}</span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {activity.timestamp.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {activity.status === 'flagged' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(activity.id, 'reviewed')}
                            className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(activity.id, 'escalated')}
                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
                          >
                            Escalate
                          </button>
                        </>
                      )}
                      
                      {activity.status === 'reviewed' && (
                        <button
                          onClick={() => handleStatusUpdate(activity.id, 'resolved')}
                          className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Evidence Details */}
                  {activity.evidence && (
                    <div className="bg-gray-800/50 rounded-lg p-4 mt-4">
                      <h4 className="text-white font-medium mb-2">Evidence:</h4>
                      <pre className="text-gray-300 text-xs overflow-x-auto">
                        {JSON.stringify(activity.evidence, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded text-sm">
                Block Suspicious Employer
              </button>
              <button className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2 rounded text-sm">
                Send Warning Notice
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm">
                Request Additional Evidence
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Risk Analysis</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">High Risk Employers:</span>
                <span className="text-red-400 font-medium">5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Policy Violations Today:</span>
                <span className="text-orange-400 font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Average Response Time:</span>
                <span className="text-green-400 font-medium">2.3h</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Protection</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Prevented Bypasses:</span>
                <span className="text-green-400 font-medium">£45,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pending Penalties:</span>
                <span className="text-orange-400 font-medium">��8,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Success Fee Protected:</span>
                <span className="text-green-400 font-medium">£120,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}
