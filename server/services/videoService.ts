import fetch from 'node-fetch';
import { validateEnv } from '../config/env';

interface DailyRoomConfig {
  name?: string;
  privacy?: 'public' | 'private';
  properties?: {
    max_participants?: number;
    enable_screenshare?: boolean;
    enable_chat?: boolean;
    start_video_off?: boolean;
    start_audio_off?: boolean;
    exp?: number; // Room expiration timestamp
    eject_at_room_exp?: boolean;
    enable_recording?: boolean;
    owner_only_broadcast?: boolean;
    enable_prejoin_ui?: boolean;
  };
}

interface DailyMeetingToken {
  room_name: string;
  user_name?: string;
  is_owner?: boolean;
  exp?: number; // Token expiration timestamp
  enable_recording?: boolean;
  start_video_off?: boolean;
  start_audio_off?: boolean;
}

interface DailyRoom {
  id: string;
  name: string;
  api_created: boolean;
  privacy: string;
  url: string;
  created_at: string;
  config: {
    max_participants: number;
    enable_screenshare: boolean;
    enable_chat: boolean;
    exp: number;
  };
}

interface DailyToken {
  token: string;
}

export class VideoService {
  private apiKey: string;
  private baseUrl: string;
  private domain: string;

  constructor() {
    const env = validateEnv();
    this.apiKey = process.env.DAILY_API_KEY || "";
    this.domain = process.env.DAILY_DOMAIN || "";
    this.baseUrl = 'https://api.daily.co/v1';
  }

  /**
   * Create a private room for video interviews
   */
  async createInterviewRoom(interviewId: string, maxParticipants = 10): Promise<DailyRoom> {
    const roomName = `interview-${interviewId}-${Date.now()}`;
    const expirationTime = Date.now() + (2 * 60 * 60 * 1000); // 2 hours from now

    const config: DailyRoomConfig = {
      name: roomName,
      privacy: 'private',
      properties: {
        max_participants: maxParticipants,
        enable_screenshare: true,
        enable_chat: true,
        start_video_off: false,
        start_audio_off: false,
        exp: Math.floor(expirationTime / 1000),
        eject_at_room_exp: true,
        enable_recording: true, // Enable recording for compliance
        owner_only_broadcast: false,
        enable_prejoin_ui: true
      }
    };

    const response = await this.makeRequest('POST', '/rooms', config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create Daily.co room: ${error.error || response.statusText}`);
    }

    const room: DailyRoom = await response.json();
    console.log(`[VideoService] Created interview room: ${room.name}`);
    
    return room;
  }

  /**
   * Create a meeting token for interview participants
   */
  async createMeetingToken(
    roomName: string, 
    participantName: string, 
    isOwner = false
  ): Promise<string> {
    const expirationTime = Date.now() + (3 * 60 * 60 * 1000); // 3 hours from now

    const tokenConfig: DailyMeetingToken = {
      room_name: roomName,
      user_name: participantName,
      is_owner: isOwner,
      exp: Math.floor(expirationTime / 1000),
      enable_recording: isOwner, // Only allow owner to start recording
      start_video_off: false,
      start_audio_off: false
    };

    const response = await this.makeRequest('POST', '/meeting-tokens', tokenConfig);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create meeting token: ${error.error || response.statusText}`);
    }

    const tokenData: DailyToken = await response.json();
    console.log(`[VideoService] Created meeting token for: ${participantName}`);
    
    return tokenData.token;
  }

  /**
   * Delete a room when interview is complete
   */
  async deleteRoom(roomName: string): Promise<void> {
    const response = await this.makeRequest('DELETE', `/rooms/${roomName}`);
    
    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      throw new Error(`Failed to delete room: ${error.error || response.statusText}`);
    }

    console.log(`[VideoService] Deleted room: ${roomName}`);
  }

  /**
   * Get room information
   */
  async getRoomInfo(roomName: string): Promise<DailyRoom | null> {
    const response = await this.makeRequest('GET', `/rooms/${roomName}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get room info: ${error.error || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create a complete interview session with room and tokens
   */
  async createInterviewSession(
    interviewId: string,
    employerName: string,
    studentName: string
  ): Promise<{
    room: DailyRoom;
    employerToken: string;
    studentToken: string;
    roomUrl: string;
  }> {
    try {
      // Create the room
      const room = await this.createInterviewRoom(interviewId);
      
      // Create tokens for both participants
      const [employerToken, studentToken] = await Promise.all([
        this.createMeetingToken(room.name, employerName, true), // Employer is owner
        this.createMeetingToken(room.name, studentName, false)  // Student is participant
      ]);

      const roomUrl = `https://${this.domain}.daily.co/${room.name}`;

      console.log(`[VideoService] Created complete interview session for interview ${interviewId}`);

      return {
        room,
        employerToken,
        studentToken,
        roomUrl
      };
    } catch (error) {
      console.error('[VideoService] Failed to create interview session:', error);
      throw error;
    }
  }

  /**
   * Validate that video service is properly configured
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', '/domains');
      return response.ok;
    } catch (error) {
      console.error('[VideoService] Configuration validation failed:', error);
      return false;
    }
  }

  /**
   * Get usage statistics for monitoring
   */
  async getUsageStats(): Promise<any> {
    try {
      const response = await this.makeRequest('GET', '/usage');
      
      if (!response.ok) {
        throw new Error('Failed to get usage stats');
      }

      return await response.json();
    } catch (error) {
      console.error('[VideoService] Failed to get usage stats:', error);
      return null;
    }
  }

  /**
   * Make authenticated request to Daily.co API
   */
  private async makeRequest(
    method: string, 
    endpoint: string, 
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: any = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    console.log(`[VideoService] ${method} ${endpoint}`);
    
    return await fetch(url, options);
  }
}

// Export singleton instance
export const videoService = new VideoService();

// Export types for use in other modules
export type { DailyRoom, DailyMeetingToken, DailyRoomConfig };
