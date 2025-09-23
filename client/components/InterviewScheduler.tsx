import React, { useState, useCallback } from 'react';
import { Calendar, Clock, Video, Mail, User, Building2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useVideoInterview } from '../hooks/useVideoInterview';

interface InterviewSchedulerProps {
  applicationId: string;
  apprenticeshipTitle: string;
  studentName: string;
  studentEmail: string;
  employerName: string;
  onScheduled?: (interviewData: any) => void;
  onCancel?: () => void;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export function InterviewScheduler({
  applicationId,
  apprenticeshipTitle,
  studentName,
  studentEmail,
  employerName,
  onScheduled,
  onCancel
}: InterviewSchedulerProps) {
  const { scheduleInterview, loading, error } = useVideoInterview();
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const [notes, setNotes] = useState<string>('');
  const [step, setStep] = useState<'datetime' | 'confirm' | 'success'>('datetime');
  const [scheduledInterview, setScheduledInterview] = useState<any>(null);

  // Generate available time slots for next 14 days
  const generateAvailableSlots = useCallback((date: string) => {
    const timeSlots: TimeSlot[] = [];
    const selectedDay = new Date(date);
    const dayOfWeek = selectedDay.getDay();
    
    // Business hours: 9 AM to 5 PM, Monday to Friday
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      for (let hour = 9; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          timeSlots.push({
            id: `${date}-${timeString}`,
            time: timeString,
            available: Math.random() > 0.3 // Mock availability
          });
        }
      }
    }
    
    return timeSlots;
  }, []);

  // Get available dates for next 14 days
  const getAvailableDates = useCallback(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends
      if (date.getDay() >= 1 && date.getDay() <= 5) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-GB', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        });
      }
    }
    
    return dates;
  }, []);

  const handleSchedule = useCallback(async () => {
    if (!selectedDate || !selectedTime) return;

    const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`);
    
    try {
      const result = await scheduleInterview({
        applicationId,
        scheduledAt: scheduledAt.toISOString(),
        duration
      });

      if (result) {
        setScheduledInterview(result);
        setStep('success');
        onScheduled?.(result);
      }
    } catch (err) {
      console.error('Failed to schedule interview:', err);
    }
  }, [selectedDate, selectedTime, duration, applicationId, scheduleInterview, onScheduled]);

  const availableDates = getAvailableDates();
  const availableTimeSlots = selectedDate ? generateAvailableSlots(selectedDate) : [];

  if (step === 'success' && scheduledInterview) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Interview Scheduled Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Video interview invitations have been sent to both participants
          </p>
        </div>

        <div className="bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-[#0A0E27] dark:text-white mb-4 flex items-center">
            <Video className="w-5 h-5 mr-2 text-[#00D4FF]" />
            Interview Details
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Position:</span>
              <span className="font-medium text-gray-900 dark:text-white">{apprenticeshipTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Student:</span>
              <span className="font-medium text-gray-900 dark:text-white">{studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Date & Time:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(scheduledInterview.scheduledAt).toLocaleString('en-GB')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Duration:</span>
              <span className="font-medium text-gray-900 dark:text-white">{duration} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Interview ID:</span>
              <span className="font-mono text-sm text-gray-900 dark:text-white">{scheduledInterview.interviewId}</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Mail className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-400">Email Invitations Sent</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Both the employer and student have received email invitations with video call links and calendar events.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.open(scheduledInterview.roomUrl, '_blank')}
            className="flex-1 bg-[#00D4FF] text-[#0A0E27] py-3 px-4 rounded-lg font-semibold hover:bg-[#00D4FF]/90 transition-colors focus-indicator flex items-center justify-center"
          >
            <Video className="w-4 h-4 mr-2" />
            Open Video Room
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-indicator"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    const confirmDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Confirm Interview Details
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Please review the interview details before scheduling
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <Building2 className="w-5 h-5 text-[#00D4FF] mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{apprenticeshipTitle}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Position</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <User className="w-5 h-5 text-[#00D4FF] mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{studentName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{studentEmail}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-[#00D4FF] mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {confirmDateTime.toLocaleDateString('en-GB', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-[#00D4FF] mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {confirmDateTime.toLocaleTimeString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })} ({duration} minutes)
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Time & Duration</p>
              </div>
            </div>
          </div>
        </div>

        {notes && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-2">Additional Notes:</h4>
            <p className="text-sm text-blue-800 dark:text-blue-300">{notes}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep('datetime')}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-indicator"
          >
            Back
          </button>
          <button
            onClick={handleSchedule}
            disabled={loading}
            className="flex-1 bg-[#00D4FF] text-[#0A0E27] py-3 px-4 rounded-lg font-semibold hover:bg-[#00D4FF]/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus-indicator flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0A0E27] border-t-transparent rounded-full animate-spin mr-2" />
                Scheduling...
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Schedule Interview
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Schedule Video Interview
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Select a date and time for the video interview with {studentName}
        </p>
      </div>

      <div className="space-y-6">
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Calendar className="w-4 h-4 inline mr-2" />
            Select Date
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {availableDates.map((date) => (
              <button
                key={date.value}
                onClick={() => {
                  setSelectedDate(date.value);
                  setSelectedTime(''); // Reset time selection
                }}
                className={`p-3 text-left rounded-lg border transition-colors focus-indicator ${
                  selectedDate === date.value
                    ? 'border-[#00D4FF] bg-[#00D4FF]/10 text-[#0A0E27] dark:text-white'
                    : 'border-gray-200 dark:border-gray-600 hover:border-[#00D4FF]/50 dark:hover:border-[#00D4FF]/50'
                }`}
              >
                <div className="font-medium text-sm">{date.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Clock className="w-4 h-4 inline mr-2" />
              Select Time
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {availableTimeSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedTime(slot.time)}
                  disabled={!slot.available}
                  className={`p-2 text-sm rounded-lg border transition-colors focus-indicator ${
                    !slot.available
                      ? 'border-gray-200 dark:border-gray-600 text-gray-400 cursor-not-allowed'
                      : selectedTime === slot.time
                      ? 'border-[#00D4FF] bg-[#00D4FF]/10 text-[#0A0E27] dark:text-white'
                      : 'border-gray-200 dark:border-gray-600 hover:border-[#00D4FF]/50 dark:hover:border-[#00D4FF]/50'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Duration Selection */}
        {selectedTime && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Interview Duration
            </label>
            <div className="flex gap-2">
              {[30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDuration(mins)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors focus-indicator ${
                    duration === mins
                      ? 'border-[#00D4FF] bg-[#00D4FF]/10 text-[#0A0E27] dark:text-white'
                      : 'border-gray-200 dark:border-gray-600 hover:border-[#00D4FF]/50 dark:hover:border-[#00D4FF]/50'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Optional Notes */}
        {selectedTime && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or topics to cover during the interview..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-colors resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {notes.length}/500 characters
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-indicator"
        >
          Cancel
        </button>
        <button
          onClick={() => setStep('confirm')}
          disabled={!selectedDate || !selectedTime}
          className="flex-1 bg-[#00D4FF] text-[#0A0E27] py-3 px-4 rounded-lg font-semibold hover:bg-[#00D4FF]/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus-indicator"
        >
          Review & Schedule
        </button>
      </div>
    </div>
  );
}

export default InterviewScheduler;
