import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Star, 
  Lock, 
  CreditCard, 
  FileText, 
  Eye,
  Shield,
  AlertTriangle,
  CheckCircle,
  Unlock
} from 'lucide-react';

interface StagedStudentProfile {
  level: number;
  studentId: string;
  basicInfo?: {
    firstName: string;
    lastName?: string;
    age?: number;
    location: {
      city: string;
      region: string;
    };
    profileSummary: string;
    industryInterests: string[];
  };
  skillsInfo?: {
    skills: string[];
    education: any[];
    workPreferences: {
      workType: string;
      salaryRange: string;
      industries: string[];
    };
    careerGoals: string;
  };
  portfolioInfo?: {
    workSamples: any[];
    projects: any[];
    achievements: string[];
    videoProfile?: {
      url: string;
      duration: number;
    };
  };
  contactInfo?: {
    email: string;
    phone?: string;
    fullAddress?: string;
  };
  accessMetadata: {
    accessLevel: number;
    grantedAt: Date;
    employerId: string;
    restrictions: string[];
    watermarks: boolean;
  };
}

interface StagedStudentCardProps {
  profile: StagedStudentProfile;
  onUpgradeAccess: (targetLevel: number) => void;
  onRequestInterview: () => void;
}

export function StagedStudentCard({ profile, onUpgradeAccess, onRequestInterview }: StagedStudentCardProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetLevel, setTargetLevel] = useState(profile.level + 1);

  const getLevelInfo = (level: number) => {
    const levels = {
      1: { name: 'Basic Profile', icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
      2: { name: 'Skills & Experience', icon: Star, color: 'text-green-500', bg: 'bg-green-50' },
      3: { name: 'Portfolio & Samples', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50' },
      4: { name: 'Full Contact Access', icon: Unlock, color: 'text-orange-500', bg: 'bg-orange-50' }
    };
    return levels[level as keyof typeof levels] || levels[1];
  };

  const getUpgradeRequirements = (level: number) => {
    const requirements = {
      2: { name: 'Sign Employer Agreement', cost: 'Free', description: 'Access detailed skills and experience' },
      3: { name: 'Interview Access Fee', cost: '£50', description: 'View portfolio and schedule platform interview' },
      4: { name: 'Success Fee Commitment', cost: '15% of salary', description: 'Full contact details and direct hiring' }
    };
    return requirements[level as keyof typeof requirements];
  };

  const renderBasicInfo = () => {
    if (!profile.basicInfo) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">
              {profile.basicInfo.firstName} {profile.basicInfo.lastName || '***'}
            </h3>
            <div className="flex items-center text-gray-400 text-sm mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {profile.basicInfo.location.city}, {profile.basicInfo.location.region}
              {profile.basicInfo.age && <span className="ml-2">• Age {profile.basicInfo.age}</span>}
            </div>
          </div>
          <AccessLevelBadge level={profile.level} />
        </div>

        <p className="text-gray-300 text-sm">
          {profile.basicInfo.profileSummary}
        </p>

        <div className="flex flex-wrap gap-2">
          {profile.basicInfo.industryInterests.map((interest, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-orange/20 text-orange text-xs rounded-full"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderSkillsInfo = () => {
    if (!profile.skillsInfo || profile.level < 2) {
      return (
        <LockedSection 
          level={2} 
          title="Skills & Experience" 
          description="Detailed skills, education, and work preferences"
          onUnlock={() => setShowUpgradeModal(true)}
        />
      );
    }

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-white">Skills & Experience</h4>
        
        <div>
          <p className="text-sm text-gray-400 mb-2">Core Skills:</p>
          <div className="flex flex-wrap gap-2">
            {profile.skillsInfo.skills.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">Work Preferences:</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Type:</span> 
              <span className="text-white ml-2">{profile.skillsInfo.workPreferences.workType}</span>
            </div>
            <div>
              <span className="text-gray-400">Salary:</span> 
              <span className="text-white ml-2">{profile.skillsInfo.workPreferences.salaryRange}</span>
            </div>
          </div>
        </div>

        {profile.skillsInfo.education.length > 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Education:</p>
            <div className="space-y-2">
              {profile.skillsInfo.education.map((edu, index) => (
                <div key={index} className="text-sm">
                  <span className="text-white">{edu.degree}</span>
                  <span className="text-gray-400 ml-2">at {edu.institution}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPortfolioInfo = () => {
    if (!profile.portfolioInfo || profile.level < 3) {
      return (
        <LockedSection 
          level={3} 
          title="Portfolio & Work Samples" 
          description="View work samples, projects, and video profile"
          onUnlock={() => setShowUpgradeModal(true)}
          requiresPayment={true}
        />
      );
    }

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-white">Portfolio & Work Samples</h4>
        
        {profile.portfolioInfo.achievements.length > 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Key Achievements:</p>
            <ul className="space-y-1">
              {profile.portfolioInfo.achievements.map((achievement, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {profile.portfolioInfo.videoProfile && (
          <div className="relative">
            <p className="text-sm text-gray-400 mb-2">Video Profile:</p>
            <div className="bg-gray-800 rounded-lg p-4 border border-orange/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">30-second introduction</span>
                {profile.accessMetadata.watermarks && (
                  <div className="flex items-center text-orange text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Watermarked
                  </div>
                )}
              </div>
              <button className="mt-2 bg-orange hover:bg-orange/90 text-white px-4 py-2 rounded text-sm">
                Play Video
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-400 mb-2">Work Experience:</p>
          <div className="space-y-2">
            {profile.portfolioInfo.workSamples.map((sample, index) => (
              <div key={index} className="bg-gray-800/50 rounded p-3">
                <div className="text-sm text-white font-medium">{sample.position}</div>
                <div className="text-xs text-gray-400">{sample.company}</div>
                <div className="text-xs text-gray-300 mt-1">{sample.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContactInfo = () => {
    if (!profile.contactInfo || profile.level < 4) {
      return (
        <LockedSection 
          level={4} 
          title="Contact Information" 
          description="Direct email, phone, and full contact details"
          onUnlock={() => setShowUpgradeModal(true)}
          requiresCommitment={true}
        />
      );
    }

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-white">Contact Information</h4>
        
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="text-gray-400 w-16">Email:</span>
              <span className="text-white">{profile.contactInfo.email}</span>
            </div>
            {profile.contactInfo.phone && (
              <div className="flex items-center">
                <span className="text-gray-400 w-16">Phone:</span>
                <span className="text-white">{profile.contactInfo.phone}</span>
              </div>
            )}
            {profile.contactInfo.fullAddress && (
              <div className="flex items-center">
                <span className="text-gray-400 w-16">Address:</span>
                <span className="text-white">{profile.contactInfo.fullAddress}</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-green-500/30">
            <div className="flex items-center text-green-400 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Success fee applies (15% of first-year salary)
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
      {/* Watermark indicator */}
      {profile.accessMetadata.watermarks && (
        <div className="mb-4 flex items-center justify-between bg-orange/10 border border-orange/20 rounded-lg p-3">
          <div className="flex items-center text-orange text-sm">
            <Shield className="h-4 w-4 mr-2" />
            Protected Content - Platform Use Only
          </div>
          <span className="text-xs text-gray-400">
            Candidate ID: {profile.studentId.substring(0, 8)}***
          </span>
        </div>
      )}

      <div className="space-y-6">
        {renderBasicInfo()}
        {renderSkillsInfo()}
        {renderPortfolioInfo()}
        {renderContactInfo()}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="flex gap-3">
          {profile.level >= 3 && (
            <button
              onClick={onRequestInterview}
              className="flex-1 bg-orange hover:bg-orange/90 text-white px-4 py-2 rounded-lg font-medium"
            >
              Request Platform Interview
            </button>
          )}
          
          {profile.level < 4 && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center"
            >
              <Unlock className="h-4 w-4 mr-2" />
              Upgrade Access
            </button>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <AccessUpgradeModal
          currentLevel={profile.level}
          targetLevel={targetLevel}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={onUpgradeAccess}
        />
      )}
    </div>
  );
}

// Helper Components
function AccessLevelBadge({ level }: { level: number }) {
  const levelInfo = {
    1: { name: 'Basic', color: 'bg-blue-500' },
    2: { name: 'Skills', color: 'bg-green-500' },
    3: { name: 'Portfolio', color: 'bg-purple-500' },
    4: { name: 'Full Access', color: 'bg-orange-500' }
  };

  const info = levelInfo[level as keyof typeof levelInfo] || levelInfo[1];

  return (
    <div className={`${info.color} text-white px-3 py-1 rounded-full text-xs font-medium`}>
      Level {level}: {info.name}
    </div>
  );
}

function LockedSection({ 
  level, 
  title, 
  description, 
  onUnlock, 
  requiresPayment = false,
  requiresCommitment = false 
}: {
  level: number;
  title: string;
  description: string;
  onUnlock: () => void;
  requiresPayment?: boolean;
  requiresCommitment?: boolean;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600 text-center">
      <Lock className="h-8 w-8 text-gray-500 mx-auto mb-3" />
      <h4 className="font-semibold text-gray-300 mb-2">Level {level}: {title}</h4>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      
      <div className="flex items-center justify-center text-xs text-gray-500 mb-4">
        {requiresCommitment && (
          <div className="flex items-center">
            <FileText className="h-3 w-3 mr-1" />
            Success fee commitment required
          </div>
        )}
        {requiresPayment && (
          <div className="flex items-center">
            <CreditCard className="h-3 w-3 mr-1" />
            Payment required
          </div>
        )}
        {!requiresPayment && !requiresCommitment && (
          <div className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            Agreement required
          </div>
        )}
      </div>
      
      <button
        onClick={onUnlock}
        className="bg-orange hover:bg-orange/90 text-white px-4 py-2 rounded-lg text-sm font-medium"
      >
        Unlock Level {level}
      </button>
    </div>
  );
}

function AccessUpgradeModal({ 
  currentLevel, 
  targetLevel, 
  onClose, 
  onUpgrade 
}: {
  currentLevel: number;
  targetLevel: number;
  onClose: () => void;
  onUpgrade: (level: number) => void;
}) {
  const requirements = {
    2: { name: 'Sign Employer Agreement', cost: 'Free', description: 'Access detailed skills and experience' },
    3: { name: 'Interview Access Fee', cost: '£50', description: 'View portfolio and schedule platform interview' },
    4: { name: 'Success Fee Commitment', cost: '15% of salary', description: 'Full contact details and direct hiring' }
  };

  const requirement = requirements[targetLevel as keyof typeof requirements];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Upgrade to Level {targetLevel}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ×
          </button>
        </div>

        {requirement && (
          <div className="space-y-4">
            <div className="bg-orange/10 border border-orange/20 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">{requirement.name}</h4>
              <p className="text-gray-300 text-sm mb-2">{requirement.description}</p>
              <div className="text-orange font-bold">{requirement.cost}</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpgrade(targetLevel);
                  onClose();
                }}
                className="flex-1 bg-orange hover:bg-orange/90 text-white px-4 py-2 rounded-lg"
              >
                Proceed
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
