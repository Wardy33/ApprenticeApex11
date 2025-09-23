import React, { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle, Shield, Gavel } from 'lucide-react';
import { LoadingButton } from './ui/loading';

interface EmployerAgreementProps {
  onAccept: (agreementData: any) => void;
  onDecline: () => void;
  studentId: string;
  accessLevel: number;
}

export function EmployerAgreement({ onAccept, onDecline, studentId, accessLevel }: EmployerAgreementProps) {
  const [acceptedClauses, setAcceptedClauses] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    companyName: '',
    authorizedSignatory: '',
    position: '',
    email: '',
    date: new Date().toISOString().split('T')[0]
  });

  const agreementClauses = [
    {
      id: 'no_poaching',
      title: 'No-Poaching Commitment',
      content: 'I agree that my company will not contact candidates directly outside the ApprenticeApex platform or attempt to hire candidates met through ApprenticeApex without using platform services.',
      penalty: 'Violation penalty: £500 per unauthorized contact, £2,000 per unauthorized hire'
    },
    {
      id: 'platform_fee',
      title: 'Platform Fee Obligation', 
      content: 'I acknowledge that any apprentice hired from candidates sourced through ApprenticeApex owes a success fee of 15% of the first-year apprentice salary, regardless of whether the hire occurs on or off the platform.',
      penalty: 'This obligation applies for 12 months from first contact'
    },
    {
      id: 'exclusive_period',
      title: 'Exclusive Period Restriction',
      content: 'I agree to a 12-month restriction period during which any hire of candidates initially contacted through ApprenticeApex must be processed through the platform and incur applicable success fees.',
      penalty: 'Full success fee due regardless of final contact method'
    },
    {
      id: 'monitoring_consent',
      title: 'Monitoring and Audit Rights',
      content: 'I consent to ApprenticeApex monitoring platform communications and tracking candidate interactions. I agree to provide hiring records and employment verification upon request.',
      penalty: 'Refusal to cooperate may result in account suspension'
    },
    {
      id: 'information_security',
      title: 'Information Security and Non-Disclosure',
      content: 'I will not share candidate information with third parties without platform consent. All candidate data must be used solely for legitimate recruitment purposes through ApprenticeApex.',
      penalty: 'Violation penalty: £1,000 per candidate information breach'
    },
    {
      id: 'platform_messaging',
      title: 'Platform-Only Communication',
      content: 'I agree to conduct all initial communications with candidates exclusively through ApprenticeApex messaging system until Level 4 access is granted and success fee commitment is accepted.',
      penalty: 'External contact attempts will be flagged and may result in access restrictions'
    }
  ];

  const getAccessLevelBenefits = (level: number) => {
    const benefits = {
      2: [
        'View detailed skills and qualifications',
        'Access education and work history',
        'See work preferences and salary expectations',
        'Platform messaging with candidates'
      ],
      3: [
        'All Level 2 benefits',
        'View portfolio and work samples',
        'Access video profile (watermarked)',
        'Schedule platform-hosted interviews',
        'See achievement records'
      ],
      4: [
        'All Level 3 benefits',
        'Full contact information (email, phone)',
        'Direct hiring capability',
        'Complete address details',
        'Emergency contact information'
      ]
    };

    return benefits[level as keyof typeof benefits] || [];
  };

  const handleClauseAcceptance = (clauseId: string, accepted: boolean) => {
    setAcceptedClauses(prev => ({
      ...prev,
      [clauseId]: accepted
    }));
  };

  const allClausesAccepted = agreementClauses.every(clause => acceptedClauses[clause.id]);

  const handleSubmit = async () => {
    if (!allClausesAccepted) return;

    setIsSubmitting(true);
    
    try {
      const agreementData = {
        studentId,
        accessLevel,
        acceptedClauses,
        companyInfo,
        signedAt: new Date().toISOString(),
        ipAddress: 'tracked', // Would be actual IP in production
        userAgent: navigator.userAgent
      };

      await onAccept(agreementData);
    } catch (error) {
      console.error('Error submitting agreement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-orange/10 border-b border-orange/20 p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-orange mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-white">
                Employer Platform Agreement
              </h2>
              <p className="text-gray-300 mt-1">
                Level {accessLevel} Access - Required for candidate information access
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Access Level Benefits */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              Level {accessLevel} Access Includes:
            </h3>
            <ul className="space-y-2">
              {getAccessLevelBenefits(accessLevel).map((benefit, index) => (
                <li key={index} className="text-gray-300 text-sm flex items-center">
                  <div className="w-2 h-2 bg-orange rounded-full mr-3"></div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Agreement Clauses */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <Gavel className="h-5 w-5 text-orange mr-2" />
              Agreement Terms and Conditions
            </h3>

            <div className="space-y-6">
              {agreementClauses.map((clause, index) => (
                <div key={clause.id} className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-2">
                        {index + 1}. {clause.title}
                      </h4>
                      <p className="text-gray-300 text-sm leading-relaxed mb-3">
                        {clause.content}
                      </p>
                      {clause.penalty && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <div className="flex items-center text-red-400 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {clause.penalty}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedClauses[clause.id] || false}
                      onChange={(e) => handleClauseAcceptance(clause.id, e.target.checked)}
                      className="w-4 h-4 text-orange border-gray-600 rounded focus:ring-orange bg-gray-800 mr-3"
                    />
                    <span className="text-sm text-gray-300">
                      I acknowledge and accept this term
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 text-orange mr-2" />
              Authorized Signatory Information
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyInfo.companyName}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Authorized Signatory *
                </label>
                <input
                  type="text"
                  required
                  value={companyInfo.authorizedSignatory}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, authorizedSignatory: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Position/Title *
                </label>
                <input
                  type="text"
                  required
                  value={companyInfo.position}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange"
                  placeholder="Job title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange"
                  placeholder="signatory@company.com"
                />
              </div>
            </div>
          </div>

          {/* Final Acceptance */}
          <div className="bg-orange/10 border border-orange/20 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-orange mr-2" />
              <span className="font-semibold text-white">Legal Binding Agreement</span>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              By signing this agreement, you acknowledge that this constitutes a legally binding contract 
              between your company and ApprenticeApex Ltd. Violations may result in legal action and 
              financial penalties as outlined above.
            </p>
            <div className="text-xs text-gray-400">
              Agreement Date: {companyInfo.date} | 
              Candidate ID: {studentId.substring(0, 8)}*** | 
              Access Level: {accessLevel}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-700">
            <button
              onClick={onDecline}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Decline Agreement
            </button>
            
            <LoadingButton
              onClick={handleSubmit}
              isLoading={isSubmitting}
              loadingText="Processing Agreement..."
              disabled={!allClausesAccepted || !companyInfo.companyName || !companyInfo.authorizedSignatory}
              className="flex-1 bg-orange hover:bg-orange/90 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign & Accept Agreement
            </LoadingButton>
          </div>

          {!allClausesAccepted && (
            <div className="text-center text-red-400 text-sm">
              Please accept all agreement terms to proceed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
