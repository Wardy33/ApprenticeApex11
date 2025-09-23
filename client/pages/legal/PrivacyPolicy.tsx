import { WebLayout } from "../../components/WebLayout";
import { SEOHead, seoConfigs } from "../../components/SEOHead";

export default function PrivacyPolicy() {
  return (
    <WebLayout>
      <SEOHead {...seoConfigs.privacyPolicy} />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center text-white drop-shadow-lg">
            Privacy Policy
          </h1>
          
          <div className="bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 border border-white/20 backdrop-blur-sm">
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
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>1. Introduction</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  ApprenticeApex ("we," "our," or "us") is committed to protecting your privacy and personal data. 
                  This Privacy Policy explains how we collect, use, process, and protect your information when you 
                  use our apprenticeship matching platform and related services (the "Service").
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  This policy applies to all users of our platform, including students seeking apprenticeships 
                  and employers posting opportunities. By using our Service, you agree to the collection and 
                  use of information in accordance with this policy.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  We operate under UK data protection laws, including the UK General Data Protection Regulation 
                  (UK GDPR) and the Data Protection Act 2018.
                </p>
              </section>

              {/* Data Controller */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>2. Data Controller</h2>
                <div className="bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 border border-white/20 backdrop-blur-sm">
                  <p className="text-gray-300 leading-relaxed mb-2">
                    <strong>ApprenticeApex Ltd</strong><br />
                    Registered in England and Wales<br />
                    Email: hello@apprenticeapex.co.uk<br />
                  </p>
                </div>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>3. Information We Collect</h2>
                
                <h3 className="text-white">3.1 Personal Information</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  When you register and use our Service, we collect:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li><strong>Identity Data:</strong> First name, last name, date of birth</li>
                  <li><strong>Contact Data:</strong> Email address, phone number, postal address and postcode</li>
                  <li><strong>Profile Data:</strong> Bio, skills, education, work experience, career preferences</li>
                  <li><strong>Location Data:</strong> City, postcode, geographical coordinates (for matching purposes)</li>
                  <li><strong>Preference Data:</strong> Industry preferences, salary expectations, work type preferences, commute preferences, transport modes</li>
                  <li><strong>Accessibility Data:</strong> Any assisted needs or accessibility requirements</li>
                  <li><strong>Qualification Data:</strong> Educational qualifications, certifications, driving license status</li>
                </ul>

                <h3 className="text-white">3.2 Professional Information</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li><strong>CVs and Documents:</strong> Uploaded CVs, certificates, portfolio items</li>
                  <li><strong>Video Profiles:</strong> 30-second introduction videos (optional)</li>
                  <li><strong>Application Data:</strong> Job applications, cover letters, interview feedback</li>
                  <li><strong>Company Information:</strong> For employers - company name, industry, job postings, company logo</li>
                </ul>

                <h3 className="text-white">3.3 Technical Information</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li><strong>Usage Data:</strong> How you interact with our platform, pages visited, time spent</li>
                  <li><strong>Device Data:</strong> IP address, browser type, device type, operating system</li>
                  <li><strong>Cookies and Tracking:</strong> See our Cookie Policy for detailed information</li>
                  <li><strong>Communication Data:</strong> Messages sent through our platform, video call logs</li>
                </ul>

                <h3 className="text-white">3.4 Sensitive Personal Data</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may collect limited sensitive personal data only where necessary and with your explicit consent:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Disability or accessibility requirements (to facilitate reasonable adjustments)</li>
                  <li>Health information (only if relevant to specific apprenticeship requirements)</li>
                </ul>
              </section>

              {/* How We Use Your Information */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>4. How We Use Your Information</h2>
                
                <h3 className="text-white">4.1 Primary Purposes</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li><strong>Matching Services:</strong> Using our AI algorithm to match students with suitable apprenticeship opportunities</li>
                  <li><strong>Account Management:</strong> Creating and managing your account, authentication, customer support</li>
                  <li><strong>Communication:</strong> Facilitating communication between students and employers</li>
                  <li><strong>Application Processing:</strong> Managing job applications, interviews, and hiring processes</li>
                  <li><strong>Payment Processing:</strong> Processing subscription fees and premium services (for employers)</li>
                </ul>

                <h3 className="text-white">4.2 Service Improvement</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Analyzing usage patterns to improve our matching algorithm</li>
                  <li>Conducting research to enhance user experience</li>
                  <li>Developing new features and services</li>
                  <li>Quality assurance and testing</li>
                </ul>

                <h3 className="text-white">4.3 Legal and Security</h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Complying with legal obligations and regulatory requirements</li>
                  <li>Detecting and preventing fraud, abuse, or security breaches</li>
                  <li>Enforcing our Terms of Service</li>
                  <li>Protecting rights, property, and safety of users and the public</li>
                </ul>
              </section>

              {/* Legal Basis */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>5. Legal Basis for Processing</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Under UK GDPR, we process your personal data on the following legal bases:
                </p>
                <ul className="text-gray-300 space-y-3 mb-6 list-disc list-inside">
                  <li><strong>Contractual Necessity:</strong> To provide our matching services and fulfill our contract with you</li>
                  <li><strong>Legitimate Interests:</strong> To improve our services, prevent fraud, and ensure platform security</li>
                  <li><strong>Consent:</strong> For marketing communications, optional features, and sensitive personal data</li>
                  <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
                  <li><strong>Vital Interests:</strong> To protect someone's life or physical safety in emergency situations</li>
                </ul>
              </section>

              {/* Data Sharing */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>6. How We Share Your Information</h2>
                
                <h3 className="text-white">6.1 With Employers (Students)</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  When you apply for apprenticeships or match with employers, we share relevant profile information including:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Name, contact information, and location</li>
                  <li>Educational background and skills</li>
                  <li>CV and video profile (if uploaded)</li>
                  <li>Relevant experience and qualifications</li>
                  <li>Match percentage and compatibility factors</li>
                </ul>

                <h3 className="text-white">6.2 With Students (Employers)</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  When students match with your opportunities, we share:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Company name and job posting details</li>
                  <li>Contact information for recruitment purposes</li>
                  <li>Application and interview feedback</li>
                </ul>

                <h3 className="text-white">6.3 Service Providers</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We work with trusted third-party service providers who help us operate our platform:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li><strong>Cloud Hosting:</strong> AWS, Google Cloud (for secure data storage)</li>
                  <li><strong>Payment Processing:</strong> Stripe (for subscription payments)</li>
                  <li><strong>Video Services:</strong> Daily.co (for video calls and profiles)</li>
                  <li><strong>Email Services:</strong> For transactional and marketing emails</li>
                  <li><strong>Analytics:</strong> To understand platform usage and improve services</li>
                  <li><strong>Customer Support:</strong> To provide user assistance</li>
                </ul>

                <h3 className="text-white">6.4 Legal Requirements</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  We may disclose your information when required by law, court order, or to protect our rights, 
                  prevent fraud, or ensure public safety.
                </p>
              </section>

              {/* Data Security */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>7. Data Security</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We implement robust security measures to protect your personal data:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using industry-standard encryption</li>
                  <li><strong>Access Controls:</strong> Strict access controls ensure only authorized personnel can access your data</li>
                  <li><strong>Regular Audits:</strong> We conduct regular security audits and vulnerability assessments</li>
                  <li><strong>Data Minimization:</strong> We only collect and retain data necessary for our services</li>
                  <li><strong>Secure Infrastructure:</strong> Our platform is hosted on secure, certified cloud infrastructure</li>
                  <li><strong>Employee Training:</strong> All staff receive regular data protection and security training</li>
                </ul>
              </section>

              {/* Data Retention */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>8. Data Retention</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We retain your personal data only for as long as necessary:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li><strong>Active Accounts:</strong> While your account remains active and for 1 year after last login</li>
                  <li><strong>Application Data:</strong> 3 years after application completion (for reference purposes)</li>
                  <li><strong>Communication Records:</strong> 2 years for customer support and compliance</li>
                  <li><strong>Financial Records:</strong> 7 years as required by UK tax law</li>
                  <li><strong>Legal Requirements:</strong> Longer periods may apply if required by law</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  You may request deletion of your data at any time, subject to our legal obligations.
                </p>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>9. Your Rights</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Under UK data protection law, you have the following rights:
                </p>
                <ul className="text-gray-300 space-y-3 mb-6 list-disc list-inside">
                  <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                  <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                  <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
                  <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                  <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for consent-based processing</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  To exercise these rights, contact us at <a href="mailto:hello@apprenticeapex.co.uk" className="text-orange hover:underline">hello@apprenticeapex.co.uk</a>. 
                  We will respond within one month of your request.
                </p>
              </section>

              {/* Cookies */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>10. Cookies and Tracking</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use cookies and similar technologies to enhance your experience. For detailed information 
                  about our cookie practices, please see our <a href="/cookie-policy" className="text-orange hover:underline">Cookie Policy</a>.
                </p>
              </section>

              {/* International Transfers */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>11. International Transfers</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Some of our service providers may be located outside the UK. When we transfer your data 
                  internationally, we ensure appropriate safeguards are in place, including:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Adequacy decisions by the UK government</li>
                  <li>Standard Contractual Clauses (SCCs)</li>
                  <li>Binding Corporate Rules</li>
                  <li>Certification schemes and codes of conduct</li>
                </ul>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>12. Children's Privacy</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Our service is intended for users aged 16 and over. We may collect data from users aged 16-18 
                  for legitimate apprenticeship purposes. For users under 18, we:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Obtain parental consent where required by law</li>
                  <li>Apply extra safeguards for processing</li>
                  <li>Limit data collection to what's necessary for apprenticeship matching</li>
                  <li>Provide additional privacy protections</li>
                </ul>
              </section>

              {/* Updates */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>13. Changes to This Policy</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may update this Privacy Policy from time to time. When we make significant changes, we will:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Post the updated policy on our website</li>
                  <li>Notify users via email or platform notification</li>
                  <li>Update the "Last Updated" date</li>
                  <li>Obtain fresh consent where required by law</li>
                </ul>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{color: '#da6927'}}>14. Contact Us</h2>
                <div className="bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 border border-white/20 backdrop-blur-sm">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    If you have questions about this Privacy Policy or our data practices, please contact us:
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    <strong>Email:</strong> <a href="mailto:hello@apprenticeapex.co.uk" className="text-orange hover:underline">hello@apprenticeapex.co.uk</a>
                  </p>
                  <p className="text-gray-300 leading-relaxed mt-4">
                    You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) 
                    at <a href="https://ico.org.uk" className="text-orange hover:underline" target="_blank" rel="noopener">ico.org.uk</a> 
                    if you believe we have not handled your data properly.
                  </p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}
