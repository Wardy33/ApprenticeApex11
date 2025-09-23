import { useState, useCallback } from 'react';
import { apiClient } from '../lib/apiUtils';

export interface AccessLevel {
  currentLevel: number;
  canUpgrade: boolean;
  nextLevel: number;
  maxLevel: number;
}

export interface StagedProfile {
  level: number;
  studentId: string;
  basicInfo?: any;
  skillsInfo?: any;
  portfolioInfo?: any;
  contactInfo?: any;
  accessMetadata: any;
}

export function useAccessControl() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStagedProfile = useCallback(async (studentId: string): Promise<StagedProfile | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.request<StagedProfile>(`/api/access-control/candidate/${studentId}/profile`);
      
      if (response.error) {
        setError(response.error.error);
        return null;
      }

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccessLevel = useCallback(async (studentId: string): Promise<AccessLevel | null> => {
    try {
      const response = await apiClient.request<AccessLevel>(`/api/access-control/candidate/${studentId}/access-level`);
      
      if (response.error) {
        setError(response.error.error);
        return null;
      }

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check access level');
      return null;
    }
  }, []);

  const requestUpgrade = useCallback(async (
    studentId: string, 
    targetLevel: number,
    agreementAccepted?: boolean
  ): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.request(`/api/access-control/candidate/${studentId}/request-upgrade`, {
        method: 'POST',
        body: {
          targetLevel,
          agreementAccepted,
          commitmentType: targetLevel >= 4 ? 'success_fee' : 'access_only'
        }
      });

      if (response.error) {
        setError(response.error.error);
        return null;
      }

      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request upgrade');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const processPayment = useCallback(async (
    studentId: string,
    targetLevel: number,
    paymentData: any
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.request<{ success: boolean }>(`/api/access-control/candidate/${studentId}/process-payment`, {
        method: 'POST',
        body: {
          targetLevel,
          ...paymentData
        }
      });

      if (response.error) {
        setError(response.error.error);
        return false;
      }

      return response.data.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptCommitment = useCallback(async (
    studentId: string,
    commitmentData: any
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.request<{ success: boolean }>(`/api/access-control/candidate/${studentId}/accept-commitment`, {
        method: 'POST',
        body: commitmentData
      });

      if (response.error) {
        setError(response.error.error);
        return false;
      }

      return response.data.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept commitment');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const trackInteraction = useCallback(async (
    studentId: string,
    interactionType: string,
    metadata?: any
  ): Promise<void> => {
    try {
      await apiClient.request(`/api/access-control/candidate/${studentId}/track-interaction`, {
        method: 'POST',
        body: {
          interactionType,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
          }
        }
      });
    } catch (err) {
      // Tracking failures shouldn't interrupt user experience
      console.warn('Failed to track interaction:', err);
    }
  }, []);

  const reportSuspiciousActivity = useCallback(async (
    studentId: string,
    reason: string,
    evidence?: any
  ): Promise<boolean> => {
    try {
      const response = await apiClient.request(`/api/access-control/candidate/${studentId}/report-suspicious`, {
        method: 'POST',
        body: {
          reason,
          evidence
        }
      });

      return !response.error;
    } catch (err) {
      console.error('Failed to report suspicious activity:', err);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    getStagedProfile,
    getAccessLevel,
    requestUpgrade,
    processPayment,
    acceptCommitment,
    trackInteraction,
    reportSuspiciousActivity,
    clearError: () => setError(null)
  };
}

// Helper hook for candidate protection
export function useCandidateProtection() {
  const reportUnauthorizedContact = useCallback(async (
    employerId: string,
    contactMethod: string,
    evidence?: any
  ): Promise<boolean> => {
    try {
      const response = await apiClient.request('/api/access-control/report-unauthorized-contact', {
        method: 'POST',
        body: {
          employerId,
          contactMethod,
          evidence,
          timestamp: new Date().toISOString()
        }
      });

      return !response.error;
    } catch (err) {
      console.error('Failed to report unauthorized contact:', err);
      return false;
    }
  }, []);

  const reportPlatformBypass = useCallback(async (
    employerId: string,
    bypassType: string,
    evidence?: any
  ): Promise<boolean> => {
    try {
      const response = await apiClient.request('/api/access-control/report-bypass', {
        method: 'POST',
        body: {
          employerId,
          bypassType,
          evidence,
          timestamp: new Date().toISOString()
        }
      });

      return !response.error;
    } catch (err) {
      console.error('Failed to report platform bypass:', err);
      return false;
    }
  }, []);

  return {
    reportUnauthorizedContact,
    reportPlatformBypass
  };
}

// Hook for monitoring and analytics
export function useMonitoring() {
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getMonitoringReport = useCallback(async (timeWindow: string = '24h') => {
    setLoading(true);
    try {
      const response = await apiClient.request(`/api/monitoring/report?timeWindow=${timeWindow}`);
      
      if (!response.error) {
        setMonitoringData(response.data);
      }
    } catch (err) {
      console.error('Failed to load monitoring data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const flagSuspiciousActivity = useCallback(async (
    employerId: string,
    studentId: string,
    activityType: string,
    severity: string,
    description: string,
    evidence?: any
  ) => {
    try {
      await apiClient.request('/api/monitoring/flag-activity', {
        method: 'POST',
        body: {
          employerId,
          studentId,
          activityType,
          severity,
          description,
          evidence
        }
      });
    } catch (err) {
      console.error('Failed to flag activity:', err);
    }
  }, []);

  return {
    monitoringData,
    loading,
    getMonitoringReport,
    flagSuspiciousActivity
  };
}
