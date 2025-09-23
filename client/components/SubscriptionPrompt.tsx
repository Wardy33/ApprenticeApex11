import React from 'react';
import { AlertTriangle, ArrowUp, CreditCard, Clock } from 'lucide-react';

interface SubscriptionPromptProps {
  type: 'trial_needed' | 'limit_reached' | 'trial_expired' | 'upgrade_needed';
  title?: string;
  message?: string;
  onStartTrial?: () => void;
  onUpgrade?: () => void;
  onClose?: () => void;
  showModal?: boolean;
}

export default function SubscriptionPrompt({
  type,
  title,
  message,
  onStartTrial,
  onUpgrade,
  onClose,
  showModal = false
}: SubscriptionPromptProps) {
  
  const getPromptContent = () => {
    switch (type) {
      case 'trial_needed':
        return {
          icon: <Clock className="w-8 h-8 text-orange-400" />,
          title: title || 'Start Your Free Trial',
          message: message || 'Begin your 60-day risk-free trial to start posting jobs and hiring apprentices.',
          primaryAction: 'Start Free Trial',
          primaryHandler: onStartTrial,
          primaryClass: 'bg-orange-500 hover:bg-orange-600 text-white'
        };
      
      case 'limit_reached':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-yellow-400" />,
          title: title || 'Limit Reached',
          message: message || 'You\'ve reached your plan limit. Upgrade to continue posting jobs.',
          primaryAction: 'Upgrade Plan',
          primaryHandler: onUpgrade,
          primaryClass: 'bg-orange-500 hover:bg-orange-600 text-white'
        };
      
      case 'trial_expired':
        return {
          icon: <CreditCard className="w-8 h-8 text-red-400" />,
          title: title || 'Trial Expired',
          message: message || 'Your 60-day trial has ended. Choose a plan to continue using ApprenticeApex.',
          primaryAction: 'Choose Plan',
          primaryHandler: onUpgrade,
          primaryClass: 'bg-orange-500 hover:bg-orange-600 text-white'
        };
      
      case 'upgrade_needed':
        return {
          icon: <ArrowUp className="w-8 h-8 text-blue-400" />,
          title: title || 'Upgrade Required',
          message: message || 'This feature requires a higher plan. Upgrade to unlock advanced capabilities.',
          primaryAction: 'Upgrade Now',
          primaryHandler: onUpgrade,
          primaryClass: 'bg-orange-500 hover:bg-orange-600 text-white'
        };
    }
  };

  const content = getPromptContent();

  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4">
              {content.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {content.title}
            </h3>
            <p className="text-gray-600">
              {content.message}
            </p>
          </div>
          
          <div className="flex gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            
            <button
              onClick={content.primaryHandler}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${content.primaryClass}`}
            >
              {content.primaryAction}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Inline card version
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
      <div className="mx-auto mb-4">
        {content.icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {content.title}
      </h3>
      <p className="text-gray-600 mb-4">
        {content.message}
      </p>
      
      <div className="flex gap-3 justify-center">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        
        <button
          onClick={content.primaryHandler}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${content.primaryClass}`}
        >
          {content.primaryAction}
        </button>
      </div>
    </div>
  );
}
