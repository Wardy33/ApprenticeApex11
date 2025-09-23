import { WebLayout } from "../../components/WebLayout";
import { SEOHead, seoConfigs } from "../../components/SEOHead";

export default function TermsOfService() {
  return (
    <WebLayout>
      <SEOHead {...seoConfigs.termsOfService} />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center text-white drop-shadow-lg">
            Terms of Service
          </h1>

          <div className="rounded-xl p-2 mb-8 bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 border border-white/20 backdrop-blur-sm">
            <p className="text-gray-300 text-center">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-GB', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="prose max-w-none">
            <div className="space-y-8">
              
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>1. Introduction and Acceptance</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Welcome to ApprenticeApex, the UK's leading apprenticeship matching platform. These Terms of Service 
                  ("Terms") govern your use of our website, mobile application, and related services (collectively, the "Service") 
                  operated by ApprenticeApex Ltd, a company registered in England and Wales.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any 
                  part of these terms, you may not access the Service. These Terms apply to all visitors, users, 
                  students, employers, and others who access or use the Service.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Our Service facilitates connections between students seeking apprenticeships and employers offering 
                  apprenticeship opportunities. We are not an employment agency and do not guarantee employment outcomes.
                </p>
              </section>

              {/* Definitions */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>2. Definitions</h2>
                <ul className="text-gray-300 space-y-3 mb-6 list-disc list-inside">
                  <li><strong>"Platform"</strong> refers to the ApprenticeApex website, mobile app, and related services</li>
                  <li><strong>"Student"</strong> refers to individuals seeking apprenticeship opportunities</li>
                  <li><strong>"Employer"</strong> refers to companies, organizations, or individuals posting apprenticeship opportunities</li>
                  <li><strong>"Content"</strong> refers to all information, data, text, profiles, messages, and materials on the Platform</li>
                  <li><strong>"Match"</strong> refers to the AI-powered connection between students and apprenticeship opportunities</li>
                  <li><strong>"Application"</strong> refers to student applications to apprenticeship opportunities</li>
                </ul>
              </section>

              {/* Eligibility */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>3. Eligibility and Account Registration</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">3.1 Age Requirements</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Students must be at least 16 years old to use our Service</li>
                  <li>Users under 18 may need parental consent for certain features</li>
                  <li>Employers must be at least 18 years old and legally authorized to represent their organization</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">3.2 Account Registration</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  To use our Service, you must:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">3.3 Account Types</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li><strong>Student Accounts:</strong> Free accounts for individuals seeking apprenticeships</li>
                  <li><strong>Employer Accounts:</strong> May include free and premium tiers with different features and limitations</li>
                </ul>
              </section>

              {/* User Responsibilities */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>4. User Responsibilities and Conduct</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">4.1 Student Responsibilities</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Provide truthful and accurate information in your profile and applications</li>
                  <li>Keep your skills, experience, and qualifications up to date</li>
                  <li>Respond professionally to employer communications</li>
                  <li>Attend scheduled interviews and notify employers of any changes</li>
                  <li>Use the platform for legitimate apprenticeship seeking purposes only</li>
                  <li>Not create multiple accounts or misrepresent your identity</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">4.2 Employer Responsibilities</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Post only legitimate apprenticeship opportunities that comply with UK law</li>
                  <li>Provide accurate job descriptions, requirements, and compensation details</li>
                  <li>Ensure all opportunities meet UK apprenticeship standards and regulations</li>
                  <li>Respond to applications in a timely and professional manner</li>
                  <li>Comply with equality, diversity, and non-discrimination laws</li>
                  <li>Pay applicable subscription fees and charges on time</li>
                  <li>Not post misleading, fraudulent, or discriminatory content</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">4.3 Prohibited Activities</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  All users are prohibited from:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Using the Service for any illegal, harmful, or unauthorized purpose</li>
                  <li>Harassing, abusing, or discriminating against other users</li>
                  <li>Posting false, misleading, or defamatory content</li>
                  <li>Attempting to circumvent security measures or access restrictions</li>
                  <li>Using automated tools or bots to access the Service</li>
                  <li>Collecting personal information of other users without consent</li>
                  <li>Posting content that violates intellectual property rights</li>
                  <li>Soliciting users for other services or platforms</li>
                </ul>
              </section>

              {/* Apprenticeship-Specific Terms */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>5. Apprenticeship-Specific Terms</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">5.1 Apprenticeship Standards</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  All apprenticeship opportunities posted on our platform must:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Comply with UK apprenticeship standards and regulations</li>
                  <li>Meet minimum wage requirements for apprentices</li>
                  <li>Provide structured learning and development opportunities</li>
                  <li>Include proper mentorship and supervision</li>
                  <li>Lead to recognized qualifications where applicable</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">5.2 Matching Algorithm</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Our AI matching algorithm considers various factors including:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Location and commute preferences</li>
                  <li>Skills and experience alignment</li>
                  <li>Industry and role preferences</li>
                  <li>Salary expectations and work type preferences</li>
                  <li>Educational background and qualifications</li>
                  <li>Accessibility requirements and driving license status</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  Matches are suggestions only and do not guarantee employment or successful applications.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">5.3 Application Process</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Students must complete their profile before applying to opportunities</li>
                  <li>Applications are facilitated through our platform but employment contracts are between students and employers</li>
                  <li>We may track application outcomes for service improvement purposes</li>
                  <li>Interview scheduling and conduct are between students and employers</li>
                </ul>
              </section>

              {/* Anti-Poaching and Platform Protection */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>6. Anti-Poaching and Revenue Protection</h2>

                <h3 className="text-xl font-semibold mb-3 text-white">6.1 No-Poaching Clause</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <strong>Employers are strictly prohibited from:</strong>
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Contacting candidates directly outside the ApprenticeApex platform</li>
                  <li>Soliciting candidates through email, phone, social media, or any other external channel</li>
                  <li>Attempting to hire candidates met through ApprenticeApex without using platform services</li>
                  <li>Sharing candidate information with third parties without platform consent</li>
                  <li>Encouraging candidates to communicate outside the platform</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">6.2 Platform Fee Obligation</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <strong>Success Fee Requirements:</strong>
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Any apprentice hired from a candidate sourced through ApprenticeApex owes a success fee of 15% of the first-year apprentice salary</li>
                  <li>This obligation applies regardless of whether the hire occurs on or off the platform</li>
                  <li>Fee is due within 30 days of the apprentice's start date</li>
                  <li>Employers must notify ApprenticeApex of any hire within 7 days</li>
                  <li>Platform has audit rights to verify compliance with hiring records</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">6.3 Liquidated Damages</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  <strong>Bypass penalties include:</strong>
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li><strong>Contact Bypass:</strong> £500 penalty per unauthorized contact attempt</li>
                  <li><strong>Hire Bypass:</strong> £2,000 penalty plus full success fee per unauthorized hire</li>
                  <li><strong>Information Sharing:</strong> £1,000 penalty per candidate information breach</li>
                  <li><strong>Repeat Violations:</strong> Account suspension and legal action</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">6.4 Exclusive Period</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Employers have a 12-month restriction period during which any hire of candidates
                  initially contacted through ApprenticeApex must be processed through the platform
                  and incur the applicable success fees, regardless of when or how the final contact occurred.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">6.5 Monitoring and Enforcement</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  ApprenticeApex reserves the right to:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Monitor all platform communications for compliance</li>
                  <li>Track candidate interactions and employment outcomes</li>
                  <li>Investigate suspected bypass activities</li>
                  <li>Request hiring records and employment verification</li>
                  <li>Pursue legal action for contract violations</li>
                </ul>
              </section>

              {/* Payment Terms */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>7. Payment Terms and Subscriptions</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">6.1 Student Services</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Our core matching and application services are free for students. Premium features, 
                  if introduced, will be clearly disclosed with pricing information.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">6.2 Employer Subscriptions</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Basic employer features may be available for free with limitations</li>
                  <li>Premium subscriptions provide enhanced features and capabilities</li>
                  <li>Subscription fees are charged monthly or annually as selected</li>
                  <li>All fees are exclusive of applicable taxes unless stated otherwise</li>
                  <li>Price changes will be communicated with 30 days advance notice</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">6.3 Billing and Cancellation</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Subscriptions automatically renew unless cancelled</li>
                  <li>Cancellation can be done through account settings or by contacting support</li>
                  <li>Refunds are provided according to our refund policy</li>
                  <li>Access to premium features ends at the subscription period conclusion</li>
                </ul>
              </section>

              {/* Intellectual Property */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>8. Intellectual Property Rights</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">7.1 Platform Ownership</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  The ApprenticeApex platform, including its design, functionality, algorithms, and content 
                  (excluding user-generated content), is owned by ApprenticeApex Ltd and protected by 
                  intellectual property laws.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">7.2 User Content</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>You retain ownership of content you create and upload</li>
                  <li>You grant us a license to use, display, and process your content for service purposes</li>
                  <li>You must have rights to all content you upload</li>
                  <li>You're responsible for ensuring your content doesn't infringe others' rights</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">7.3 Restrictions</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>You may not copy, modify, or distribute our platform or its content</li>
                  <li>Reverse engineering or attempting to access source code is prohibited</li>
                  <li>Our trademarks and branding may not be used without permission</li>
                </ul>
              </section>

              {/* Privacy and Data */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>9. Privacy and Data Protection</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Your privacy is important to us. Our collection and use of personal information is governed 
                  by our <a href="/privacy-policy" className="text-orange hover:underline">Privacy Policy</a>, 
                  which forms an integral part of these Terms.
                </p>
                <p className="text-gray-300 leading-relaxed mb-6">
                  By using our Service, you consent to the collection and use of information as described 
                  in our Privacy Policy and these Terms.
                </p>
              </section>

              {/* Service Availability */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>10. Service Availability and Modifications</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">9.1 Service Availability</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>We strive to maintain high service availability but cannot guarantee 100% uptime</li>
                  <li>Planned maintenance will be communicated in advance where possible</li>
                  <li>Emergency maintenance may occur without advance notice</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">9.2 Service Modifications</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  We reserve the right to modify, suspend, or discontinue any aspect of our Service 
                  with reasonable notice. We may also add new features or change existing functionality 
                  to improve user experience.
                </p>
              </section>

              {/* Disclaimers */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>11. Disclaimers and Limitations</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">10.1 Service Disclaimers</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Our Service is provided "as is" without warranties of any kind</li>
                  <li>We do not guarantee successful matches or employment outcomes</li>
                  <li>We are not responsible for the accuracy of user-provided information</li>
                  <li>We do not endorse or guarantee any employers or students on our platform</li>
                  <li>Employment relationships are solely between students and employers</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">10.2 Limitation of Liability</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  To the maximum extent permitted by law, ApprenticeApex shall not be liable for any 
                  indirect, incidental, special, consequential, or punitive damages, or any loss of 
                  profits or revenues, whether incurred directly or indirectly, or any loss of data, 
                  use, goodwill, or other intangible losses.
                </p>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>12. Account Termination</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">11.1 Termination by You</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>You may close your account at any time through account settings</li>
                  <li>Closing your account will remove your profile from matching algorithms</li>
                  <li>Some data may be retained as required by law or for legitimate business purposes</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">11.2 Termination by Us</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may suspend or terminate your account if you:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Violate these Terms or our policies</li>
                  <li>Engage in fraudulent or harmful activities</li>
                  <li>Fail to pay applicable fees</li>
                  <li>Remain inactive for an extended period</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">11.3 Effect of Termination</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Upon termination, your right to use the Service ceases immediately. Provisions that 
                  by their nature should survive termination will remain in effect.
                </p>
              </section>

              {/* Dispute Resolution */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>13. Dispute Resolution and Governing Law</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-white">12.1 Governing Law</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  These Terms are governed by the laws of England and Wales. Any disputes will be 
                  subject to the exclusive jurisdiction of the English courts.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">12.2 Dispute Resolution Process</h3>
                <ol className="text-gray-300 space-y-2 mb-6 list-decimal list-inside">
                  <li>Contact our support team to attempt informal resolution</li>
                  <li>If unresolved, consider mediation through an agreed mediator</li>
                  <li>Legal proceedings as a last resort</li>
                </ol>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>14. Changes to Terms</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may modify these Terms from time to time. When we make significant changes:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>We will post the updated Terms on our platform</li>
                  <li>We will notify users via email or platform notification</li>
                  <li>Changes become effective 30 days after notification</li>
                  <li>Continued use constitutes acceptance of new Terms</li>
                </ul>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>15. Contact Information</h2>
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    For questions about these Terms or our Service, please contact us:
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    <strong>ApprenticeApex Ltd</strong><br />
                    <strong>Email:</strong> <a href="mailto:hello@apprenticeapex.co.uk" className="text-orange hover:underline">hello@apprenticeapex.co.uk</a>
                  </p>
                </div>
              </section>

              {/* Acknowledgment */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>16. Acknowledgment</h2>
                <p className="text-gray-300 leading-relaxed">
                  By using our Service, you acknowledge that you have read, understood, and agree to be 
                  bound by these Terms of Service. These Terms constitute the entire agreement between 
                  you and ApprenticeApex regarding the use of our Service.
                </p>
              </section>

            </div>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}
