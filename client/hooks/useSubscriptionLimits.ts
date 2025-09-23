import { useState, useEffect } from 'react';
import { safeGetFromLocalStorage, safeSetToLocalStorage } from '../lib/safeJsonParse';

interface SubscriptionLimits {
  canCreateJobPosting: boolean;
  canAddUser: boolean;
  isTrialExpired: boolean;
  daysLeftInTrial: number;
  hasSubscription: boolean;
  planType?: string;
  isInTrial?: boolean;
  loading: boolean;
  error?: string;
}

// Shape of demo subscription data stored in localStorage
interface DemoSubscriptionData {
  subscription?: {
    planType?: string;
    status?: string;
    isInTrial?: boolean;
    monthlyFee?: number;
    successFeeRate?: number;
    successFeeDescription?: string;
    features?: Record<string, unknown>;
    usage?: {
      jobPostingsThisMonth?: number;
      usersActive?: number;
      hiresThisMonth?: number;
    };
    trialEndDate?: string;
  };
  outstandingBalance?: {
    totalAmount?: number;
    count?: number;
  };
  isTrialExpired?: boolean;
  daysLeftInTrial?: number;
  limits?: {
    canCreateJobPosting?: boolean;
    canAddUser?: boolean;
  };
}

export function useSubscriptionLimits() {
  const [limits, setLimits] = useState<SubscriptionLimits>({
    canCreateJobPosting: true, // Default to true for better UX
    canAddUser: true,
    isTrialExpired: false,
    daysLeftInTrial: 0,
    hasSubscription: false,
    loading: true
  });

  useEffect(() => {
    loadSubscriptionLimits();

    // Listen for changes to demo subscription data
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'demoSubscriptionData') {
        loadSubscriptionLimits();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for manual updates to localStorage
    const handleCustomUpdate = () => {
      loadSubscriptionLimits();
    };

    window.addEventListener('subscriptionUpdated', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('subscriptionUpdated', handleCustomUpdate);
    };
  }, []);

  const loadSubscriptionLimits = async () => {
    try {
      // For demo purposes, check localStorage for subscription data
      const data = safeGetFromLocalStorage<DemoSubscriptionData | null>('demoSubscriptionData', null);

      if (data) {
        setLimits({
          canCreateJobPosting: data.limits?.canCreateJobPosting ?? true,
          canAddUser: data.limits?.canAddUser ?? true,
          isTrialExpired: data.isTrialExpired ?? false,
          daysLeftInTrial: data.daysLeftInTrial ?? 0,
          hasSubscription: true, // User has demo subscription/trial
          planType: data.subscription?.planType,
          isInTrial: data.subscription?.isInTrial,
          loading: false
        });
      } else {
        // No subscription data - user needs to start trial or subscribe
        setLimits({
          canCreateJobPosting: false,
          canAddUser: false,
          isTrialExpired: false,
          daysLeftInTrial: 0,
          hasSubscription: false,
          loading: false
        });
      }

      // In a real app, this would be:
      // const response = await fetch('/api/subscriptions/current', {
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   }
      // });
    } catch (error) {
      console.error('Error loading subscription limits:', error);
      setLimits(prev => ({ ...prev, loading: false, error: 'Connection error' }));
    }
  };

  const checkLimit = async (action: string) => {
    try {
      // For demo purposes, check localStorage for subscription data
      const data = safeGetFromLocalStorage<DemoSubscriptionData | null>('demoSubscriptionData', null);

      if (data) {
        // If user has active subscription or trial, allow most actions
        if (data.subscription?.status === 'active') {
          return {
            allowed: true,
            reason: ''
          };
        }
      }

      return {
        allowed: false,
        reason: 'No active subscription. Please start a trial or upgrade your plan.'
      };

      // In a real app, this would be:
      // const response = await fetch(`/api/subscriptions/check-limits/${action}`, {
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   }
      // });
    } catch (error) {
      console.error('Error checking subscription limit:', error);
      return {
        allowed: false,
        reason: 'Connection error'
      };
    }
  };

  const startTrial = async () => {
    try {
      // For demo purposes, create trial data directly
      const mockTrialData: DemoSubscriptionData = {
        subscription: {
          planType: 'trial',
          status: 'active',
          isInTrial: true,
          monthlyFee: 0,
          successFeeRate: 0,
          successFeeDescription: '£399 per successful apprentice placement',
          features: {},
          usage: {
            jobPostingsThisMonth: 0,
            usersActive: 1,
            hiresThisMonth: 0
          },
          trialEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
        },
        outstandingBalance: {
          totalAmount: 0,
          count: 0
        },
        isTrialExpired: false,
        daysLeftInTrial: 60,
        limits: {
          canCreateJobPosting: true,
          canAddUser: true
        }
      };

      safeSetToLocalStorage('demoSubscriptionData', mockTrialData);
      await loadSubscriptionLimits(); // Reload limits after starting trial
      return { success: true };

      // In a real app, this would be:
      // const response = await fetch('/api/subscriptions/start-trial', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
    } catch (error) {
      return { success: false, error: 'Connection error' };
    }
  };

  const refresh = () => {
    setLimits(prev => ({ ...prev, loading: true }));
    loadSubscriptionLimits();
  };

  return {
    ...limits,
    checkLimit,
    startTrial,
    refresh
  };
}
