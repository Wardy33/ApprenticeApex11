import { EmployerAccess } from '../models/EmployerAccess';
import { IUser } from '../models/User';

export interface StagedStudentProfile {
  level: number;
  studentId: string;
  
  // Level 1: Basic profile, no contact info
  basicInfo?: {
    firstName: string;
    lastName?: string; // Last initial only
    age?: number;
    location: {
      city: string;
      region: string;
      // No postcode or exact coordinates
    };
    profileSummary: string;
    industryInterests: string[];
  };
  
  // Level 2: Detailed skills, still no contacts
  skillsInfo?: {
    skills: string[];
    education: any[];
    certifications: string[];
    workPreferences: {
      workType: string;
      salaryRange: string; // Ranges only, not exact
      industries: string[];
    };
    careerGoals: string;
  };
  
  // Level 3: Portfolio/work samples, platform messaging only
  portfolioInfo?: {
    workSamples: any[];
    projects: any[];
    achievements: string[];
    videoProfile?: {
      url: string; // Watermarked/time-limited
      duration: number;
    };
    references: string; // Anonymized references
  };
  
  // Level 4: Full contact details after payment/commitment
  contactInfo?: {
    email: string;
    phone?: string;
    linkedIn?: string;
    fullAddress?: string;
    emergencyContact?: any;
  };
  
  accessMetadata: {
    accessLevel: number;
    grantedAt: Date;
    employerId: string;
    restrictions: string[];
    watermarks: boolean;
  };
}

export class AccessControlService {
  
  /**
   * Get student profile based on employer's access level
   */
  static async getStagedProfile(employerId: string, studentId: string, fullProfile: IUser): Promise<StagedStudentProfile> {
    const access = await EmployerAccess.findOne({ employerId, studentId });
    const accessLevel = access ? access.accessLevel : 1;
    
    // Record the access attempt
    await EmployerAccess.recordActivity(employerId, studentId, 'PROFILE_VIEWED', {
      accessLevel,
      timestamp: new Date()
    });
    
    const stagedProfile: StagedStudentProfile = {
      level: accessLevel,
      studentId,
      accessMetadata: {
        accessLevel,
        grantedAt: access?.accessGrantedAt || new Date(),
        employerId,
        restrictions: this.getRestrictions(accessLevel),
        watermarks: accessLevel < 4
      }
    };
    
    // Level 1: Basic profile only
    if (accessLevel >= 1) {
      stagedProfile.basicInfo = {
        firstName: fullProfile.profile?.firstName || 'Anonymous',
        lastName: fullProfile.profile?.lastName ? `${fullProfile.profile.lastName.charAt(0)}.` : undefined,
        age: this.calculateAge(fullProfile.profile?.dateOfBirth),
        location: {
          city: fullProfile.profile?.location?.city || 'Not specified',
          region: this.getRegionFromCity(fullProfile.profile?.location?.city),
        },
        profileSummary: this.truncateText(fullProfile.profile?.bio || '', 200),
        industryInterests: fullProfile.profile?.preferences?.industries || []
      };
    }
    
    // Level 2: Skills and detailed info
    if (accessLevel >= 2) {
      stagedProfile.skillsInfo = {
        skills: fullProfile.profile?.skills || [],
        education: fullProfile.profile?.education || [],
        certifications: [], // Extract from education/experience
        workPreferences: {
          workType: fullProfile.profile?.workType || 'Not specified',
          salaryRange: this.formatSalaryRange(fullProfile.profile?.preferences?.salaryRange),
          industries: fullProfile.profile?.preferences?.industries || []
        },
        careerGoals: fullProfile.profile?.bio || ''
      };
    }
    
    // Level 3: Portfolio and work samples
    if (accessLevel >= 3) {
      stagedProfile.portfolioInfo = {
        workSamples: fullProfile.profile?.experience || [],
        projects: [], // Extract from experience
        achievements: this.extractAchievements(fullProfile),
        videoProfile: fullProfile.profile?.videoProfile ? {
          url: this.addWatermark(fullProfile.profile.videoProfile.url, employerId),
          duration: 30 // Limit duration
        } : undefined,
        references: 'References available upon request'
      };
    }
    
    // Level 4: Full contact information
    if (accessLevel >= 4) {
      stagedProfile.contactInfo = {
        email: fullProfile.email,
        phone: fullProfile.profile?.phone,
        linkedIn: undefined, // Extract from profile if available
        fullAddress: `${fullProfile.profile?.location?.city}, ${fullProfile.profile?.postcode}`,
      };
    }
    
    return stagedProfile;
  }
  
  /**
   * Check if employer can upgrade access level
   */
  static async canUpgradeAccess(employerId: string, studentId: string, targetLevel: number): Promise<boolean> {
    const access = await EmployerAccess.findOne({ employerId, studentId });
    
    if (!access) {
      return targetLevel <= 1; // Anyone can get Level 1
    }
    
    // Check if agreement is signed for levels 2+
    if (targetLevel >= 2 && !access.agreementSigned) {
      return false;
    }
    
    // Check payment status for levels 3+
    if (targetLevel >= 3 && access.paymentStatus === 'none') {
      return false;
    }
    
    // Level 4 requires full commitment
    if (targetLevel >= 4 && access.commitmentType === 'none') {
      return false;
    }
    
    return true;
  }
  
  /**
   * Upgrade employer access level
   */
  static async upgradeAccess(
    employerId: string, 
    studentId: string, 
    targetLevel: number,
    commitmentType?: string,
    paymentReference?: string
  ): Promise<boolean> {
    const canUpgrade = await this.canUpgradeAccess(employerId, studentId, targetLevel);
    
    if (!canUpgrade) {
      throw new Error(`Cannot upgrade to level ${targetLevel}. Requirements not met.`);
    }
    
    await EmployerAccess.upgradeAccess(employerId, studentId, targetLevel, 'ACCESS_UPGRADED', {
      targetLevel,
      commitmentType,
      paymentReference,
      timestamp: new Date()
    });
    
    return true;
  }
  
  /**
   * Track interaction between employer and student
   */
  static async trackInteraction(
    employerId: string,
    studentId: string,
    interactionType: string,
    metadata?: any
  ): Promise<void> {
    await EmployerAccess.recordActivity(employerId, studentId, interactionType, {
      ...metadata,
      timestamp: new Date(),
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress
    });
  }
  
  /**
   * Flag suspicious activity
   */
  static async flagSuspiciousActivity(
    employerId: string,
    studentId: string,
    reason: string,
    evidence?: any
  ): Promise<void> {
    await EmployerAccess.flagSuspiciousActivity(employerId, studentId, reason);
    
    // TODO: Send alert to admin dashboard
    // TODO: Log to monitoring system
    // TODO: Consider automatic restrictions
  }
  
  // Helper methods
  private static getRestrictions(accessLevel: number): string[] {
    const restrictions = ['no_external_contact', 'platform_messaging_only'];
    
    if (accessLevel < 2) restrictions.push('limited_profile_info');
    if (accessLevel < 3) restrictions.push('no_portfolio_access', 'no_video_profile');
    if (accessLevel < 4) restrictions.push('no_contact_details', 'watermarked_content');
    
    return restrictions;
  }
  
  private static calculateAge(dateOfBirth?: string): number | undefined {
    if (!dateOfBirth) return undefined;
    
    const birth = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    
    return age;
  }
  
  private static getRegionFromCity(city?: string): string {
    // Simple mapping - in production, use a proper location service
    const regionMap: Record<string, string> = {
      'London': 'Greater London',
      'Manchester': 'North West England',
      'Birmingham': 'West Midlands',
      'Glasgow': 'Scotland',
      'Cardiff': 'Wales',
      'Belfast': 'Northern Ireland'
    };
    
    return regionMap[city || ''] || 'United Kingdom';
  }
  
  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  private static formatSalaryRange(range?: { min: number; max: number }): string {
    if (!range) return 'Not specified';
    
    // Round to nearest £2K to obscure exact expectations
    const minRounded = Math.floor(range.min / 2000) * 2000;
    const maxRounded = Math.ceil(range.max / 2000) * 2000;
    
    return `£${minRounded.toLocaleString()} - £${maxRounded.toLocaleString()}`;
  }
  
  private static extractAchievements(profile: IUser): string[] {
    // Extract achievements from bio, education, experience
    const achievements: string[] = [];
    
    // This would be more sophisticated in production
    if (profile.profile?.education) {
      profile.profile.education.forEach(edu => {
        if (edu.grade && edu.grade !== 'N/A') {
          achievements.push(`${edu.grade} in ${edu.degree}`);
        }
      });
    }
    
    return achievements;
  }
  
  private static addWatermark(videoUrl: string, employerId: string): string {
    // In production, this would add employer-specific watermarks to prevent sharing
    return `${videoUrl}?watermark=${employerId}&access=limited`;
  }
}
