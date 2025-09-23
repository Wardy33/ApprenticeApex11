import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Shield, 
  AlertTriangle, 
  Video, 
  Calendar, 
  FileText,
  Eye,
  Lock,
  Clock,
  CheckCircle
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  messageType: 'text' | 'interview_request' | 'system_notice' | 'file';
  metadata?: {
    trackingId?: string;
    accessLevel?: number;
    interviewDetails?: any;
  };
  read: boolean;
  flagged: boolean;
}

interface SecureMessagingProps {
  conversationId: string;
  employerId: string;
  studentId: string;
  accessLevel: number;
  onSendMessage: (message: string, type?: string, metadata?: any) => void;
  onRequestInterview: () => void;
  messages: Message[];
}

export function SecureMessaging({ 
  conversationId, 
  employerId, 
  studentId, 
  accessLevel,
  onSendMessage,
  onRequestInterview,
  messages 
}: SecureMessagingProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showInterviewRequest, setShowInterviewRequest] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // Track the message send attempt
    const trackingId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    onSendMessage(newMessage, 'text', { 
      trackingId,
      accessLevel,
      timestamp: new Date().toISOString()
    });
    
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageRestrictions = () => {
    const restrictions = [];
    
    if (accessLevel < 3) {
      restrictions.push('Interview scheduling not available');
    }
    if (accessLevel < 4) {
      restrictions.push('Contact information sharing blocked');
      restrictions.push('External platform links blocked');
    }
    
    return restrictions;
  };

  const renderMessage = (message: Message) => {
    const isFromEmployer = message.senderId === employerId;
    const messageClass = isFromEmployer 
      ? 'bg-orange/20 border-orange/30 ml-8' 
      : 'bg-gray-700 border-gray-600 mr-8';

    return (
      <div key={message.id} className={`rounded-lg p-4 border ${messageClass} mb-4`}>
        {/* Message Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-sm font-medium text-white">
              {isFromEmployer ? 'You' : 'Candidate'}
            </span>
            {message.metadata?.trackingId && (
              <span className="ml-2 text-xs text-gray-400">
                ID: {message.metadata.trackingId.substring(0, 8)}***
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            {message.timestamp.toLocaleTimeString()}
            {message.read && <CheckCircle className="h-3 w-3 ml-2 text-green-500" />}
          </div>
        </div>

        {/* Message Content */}
        <div className="text-gray-300">
          {message.messageType === 'text' && (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
          
          {message.messageType === 'interview_request' && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-center text-blue-400 mb-2">
                <Video className="h-4 w-4 mr-2" />
                Interview Request
              </div>
              <p className="text-sm">{message.content}</p>
              {message.metadata?.interviewDetails && (
                <div className="mt-2 text-xs text-gray-400">
                  Proposed time: {message.metadata.interviewDetails.proposedTime}
                </div>
              )}
            </div>
          )}

          {message.messageType === 'system_notice' && (
            <div className="bg-gray-600/50 border border-gray-500 rounded-lg p-3">
              <div className="flex items-center text-gray-400 mb-2">
                <Shield className="h-4 w-4 mr-2" />
                System Notice
              </div>
              <p className="text-sm">{message.content}</p>
            </div>
          )}
        </div>

        {/* Message Warnings */}
        {message.flagged && (
          <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
            <div className="flex items-center text-red-400 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              This message has been flagged for review
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSystemNotices = () => {
    const notices = [];

    if (accessLevel < 3) {
      notices.push({
        type: 'restriction',
        content: 'Interview scheduling requires Level 3 access. Upgrade to unlock video interviews.'
      });
    }

    if (accessLevel < 4) {
      notices.push({
        type: 'warning',
        content: 'Contact information sharing is blocked. Direct contact attempts outside the platform will be flagged.'
      });
    }

    return notices.map((notice, index) => (
      <div key={index} className="bg-orange/10 border border-orange/20 rounded-lg p-3 mb-4">
        <div className="flex items-center text-orange text-sm">
          <Shield className="h-4 w-4 mr-2" />
          Platform Notice
        </div>
        <p className="text-gray-300 text-sm mt-1">{notice.content}</p>
      </div>
    ));
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 h-[600px] flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 rounded-t-xl p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-orange mr-2" />
            <span className="font-semibold text-white">Secure Platform Messaging</span>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Lock className="h-4 w-4 mr-1" />
            Level {accessLevel} Access
          </div>
        </div>
        
        {/* Security Notice */}
        <div className="mt-3 bg-orange/10 border border-orange/20 rounded-lg p-2">
          <div className="flex items-center text-orange text-xs">
            <Eye className="h-3 w-3 mr-1" />
            All messages are monitored for compliance and candidate protection
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderSystemNotices()}
        
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start a secure conversation</p>
            <p className="text-sm mt-1">All messages are encrypted and monitored for compliance</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      <div className="border-t border-gray-700 p-4">
        {/* Quick Actions */}
        {accessLevel >= 3 && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setShowInterviewRequest(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              <Video className="h-3 w-3" />
              Request Interview
            </button>
            <button
              onClick={() => {/* TODO: Schedule interview */}}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm"
            >
              <Calendar className="h-3 w-3" />
              Schedule Meeting
            </button>
          </div>
        )}

        {/* Message Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (monitored for compliance)"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-orange"
              rows={2}
            />
            
            {/* Character Limit */}
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {newMessage.length}/500
            </div>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || newMessage.length > 500}
            className="bg-orange hover:bg-orange/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Restrictions Notice */}
        {getMessageRestrictions().length > 0 && (
          <div className="mt-3 bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Current restrictions:</div>
            <ul className="text-xs text-gray-500 space-y-1">
              {getMessageRestrictions().map((restriction, index) => (
                <li key={index} className="flex items-center">
                  <div className="w-1 h-1 bg-gray-500 rounded-full mr-2"></div>
                  {restriction}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Interview Request Modal */}
      {showInterviewRequest && (
        <InterviewRequestModal
          onClose={() => setShowInterviewRequest(false)}
          onSubmit={(details) => {
            onSendMessage(
              `Interview request: ${details.message}`,
              'interview_request',
              { interviewDetails: details }
            );
            setShowInterviewRequest(false);
          }}
        />
      )}
    </div>
  );
}

// Interview Request Modal Component
function InterviewRequestModal({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void; 
  onSubmit: (details: any) => void; 
}) {
  const [details, setDetails] = useState({
    proposedTime: '',
    duration: '30',
    message: '',
    interviewType: 'video'
  });

  const handleSubmit = () => {
    if (!details.proposedTime || !details.message) return;
    onSubmit(details);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Video className="h-5 w-5 mr-2 text-orange" />
            Request Platform Interview
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Proposed Date & Time
            </label>
            <input
              type="datetime-local"
              value={details.proposedTime}
              onChange={(e) => setDetails(prev => ({ ...prev, proposedTime: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-orange"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration (minutes)
            </label>
            <select
              value={details.duration}
              onChange={(e) => setDetails(prev => ({ ...prev, duration: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-orange"
            >
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message to Candidate
            </label>
            <textarea
              value={details.message}
              onChange={(e) => setDetails(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Explain the interview purpose and what you'd like to discuss..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-orange"
              rows={3}
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center text-blue-400 text-sm mb-1">
              <Shield className="h-3 w-3 mr-1" />
              Platform-Hosted Interview
            </div>
            <p className="text-xs text-gray-400">
              Interview will be conducted through our secure platform with recording for compliance
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!details.proposedTime || !details.message}
            className="flex-1 bg-orange hover:bg-orange/90 disabled:opacity-50 text-white py-2 rounded"
          >
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
}
