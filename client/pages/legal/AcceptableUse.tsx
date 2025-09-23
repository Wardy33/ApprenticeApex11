import { WebLayout } from "../../components/WebLayout";
import { SEOHead, seoConfigs } from "../../components/SEOHead";

export default function AcceptableUse() {
  return (
    <WebLayout>
      <SEOHead {...seoConfigs.acceptableUse} />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center text-white drop-shadow-lg">
            Acceptable Use Policy
          </h1>

          <div className="rounded-xl p-2 mb-8 bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 border border-white/20 backdrop-blur-sm">
            <p className="text-gray-300 text-center">
              <strong>Last Updated:</strong>{" "}
              {new Date().toLocaleDateString("en-GB", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="prose max-w-none">
            <div className="space-y-8">
              {/* Introduction */}
              <section>
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#da6927" }}
                >
                  1. Introduction
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  This Acceptable Use Policy ("Policy") governs your use of
                  ApprenticeApex's platform and services. It outlines what
                  constitutes acceptable and unacceptable behavior when using
                  our apprenticeship matching platform.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  This Policy applies to all users, including students seeking
                  apprenticeships and employers posting opportunities. Violation
                  of this Policy may result in account suspension or
                  termination.
                </p>
              </section>

              {/* Acceptable Use */}
              <section>
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#da6927" }}
                >
                  2. Acceptable Use
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You may use our platform to:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>
                    Search for and apply to legitimate apprenticeship
                    opportunities
                  </li>
                  <li>
                    Post genuine apprenticeship opportunities that comply with
                    UK law
                  </li>
                  <li>Communicate professionally with other users</li>
                  <li>
                    Share accurate information about your skills, experience,
                    and qualifications
                  </li>
                  <li>
                    Participate in interviews and the recruitment process
                    honestly
                  </li>
                  <li>Provide feedback to improve our services</li>
                </ul>
              </section>

              {/* Prohibited Activities */}
              <section>
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#da6927" }}
                >
                  3. Prohibited Activities
                </h2>

                <h3 className="text-xl font-semibold mb-3 text-white">
                  3.1 Fraudulent Behavior
                </h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Creating fake profiles or providing false information</li>
                  <li>Impersonating another person or organization</li>
                  <li>Posting non-existent or fraudulent job opportunities</li>
                  <li>
                    Misrepresenting qualifications, experience, or company
                    information
                  </li>
                  <li>
                    Using stolen or unauthorized photos, videos, or documents
                  </li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">
                  3.2 Harassment and Discrimination
                </h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>
                    Discriminating based on age, race, gender, religion, sexual
                    orientation, or disability
                  </li>
                  <li>Sending threatening, abusive, or harassing messages</li>
                  <li>Sexual harassment or inappropriate sexual content</li>
                  <li>Bullying or intimidating other users</li>
                  <li>Posting discriminatory job requirements</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">
                  3.3 Spam and Commercial Misuse
                </h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Sending unsolicited messages or advertisements</li>
                  <li>
                    Posting opportunities that are not genuine apprenticeships
                  </li>
                  <li>
                    Using our platform to recruit for non-apprenticeship roles
                  </li>
                  <li>Promoting other websites, services, or platforms</li>
                  <li>Creating multiple accounts to circumvent restrictions</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">
                  3.4 Technical Abuse
                </h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>
                    Attempting to hack, compromise, or disrupt our systems
                  </li>
                  <li>Using automated tools, bots, or scrapers</li>
                  <li>Attempting to access other users' accounts</li>
                  <li>Distributing malware, viruses, or harmful code</li>
                  <li>Reverse engineering our platform or algorithms</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">
                  3.5 Legal Violations
                </h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Violating any applicable laws or regulations</li>
                  <li>Infringing intellectual property rights</li>
                  <li>
                    Posting illegal content or soliciting illegal activities
                  </li>
                  <li>Money laundering or financial fraud</li>
                  <li>Privacy violations or unauthorized data collection</li>
                </ul>
              </section>

              {/* Content Standards */}
              <section>
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#da6927" }}
                >
                  4. Content Standards
                </h2>

                <h3 className="text-xl font-semibold mb-3 text-white">
                  4.1 Professional Content
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  All content on our platform should be:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>
                    Professional and appropriate for a workplace environment
                  </li>
                  <li>Accurate and truthful</li>
                  <li>Relevant to apprenticeships and career development</li>
                  <li>Respectful of others' privacy and dignity</li>
                  <li>Free from offensive language or imagery</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">
                  4.2 Prohibited Content
                </h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Adult content, nudity, or sexually explicit material</li>
                  <li>Violence, hate speech, or extremist content</li>
                  <li>Content promoting illegal activities</li>
                  <li>Copyrighted material without permission</li>
                  <li>Personal information of others without consent</li>
                  <li>Misleading or false information</li>
                </ul>
              </section>

              {/* Apprenticeship Standards */}
              <section>
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#da6927" }}
                >
                  5. Apprenticeship-Specific Requirements
                </h2>

                <h3 className="text-xl font-semibold mb-3 text-white">
                  5.1 For Employers
                </h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>
                    All posted opportunities must be genuine apprenticeships
                  </li>
                  <li>
                    Comply with UK apprenticeship minimum wage requirements
                  </li>
                  <li>Provide structured learning and development programs</li>
                  <li>Offer proper supervision and mentorship</li>
                  <li>
                    Meet all legal requirements for apprenticeship providers
                  </li>
                  <li>Respond to applications in a timely manner</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">
                  5.2 For Students
                </h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>
                    Only apply to opportunities you are genuinely interested in
                  </li>
                  <li>
                    Provide accurate information about your skills and
                    experience
                  </li>
                  <li>Attend interviews you have committed to</li>
                  <li>
                    Give reasonable notice if you need to cancel or withdraw
                  </li>
                  <li>Be honest about your availability and commitments</li>
                  <li>Respect employers' time and recruitment processes</li>
                </ul>
              </section>

              {/* Reporting Violations */}
              <section>
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#da6927" }}
                >
                  6. Reporting Violations
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you encounter behavior that violates this Policy, please
                  report it immediately:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Use the "Report" button on profiles or messages</li>
                  <li>
                    Email us at{" "}
                    <a
                      href="mailto:hello@apprenticeapex.co.uk"
                      className="text-orange hover:underline"
                    >
                      hello@apprenticeapex.co.uk
                    </a>
                  </li>
                  <li>Contact our support team through the platform</li>
                  <li>
                    For urgent safety concerns, contact local authorities first
                  </li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  We take all reports seriously and will investigate promptly
                  while maintaining confidentiality.
                </p>
              </section>

              {/* Enforcement */}
              <section>
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#da6927" }}
                >
                  7. Enforcement and Consequences
                </h2>

                <h3 className="text-xl font-semibold mb-3 text-white">
                  7.1 Investigation Process
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  When violations are reported or detected, we will:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Investigate the matter fairly and thoroughly</li>
                  <li>Consider context and intent</li>
                  <li>Give users an opportunity to explain their actions</li>
                  <li>Take appropriate action based on severity</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">
                  7.2 Possible Consequences
                </h3>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>
                    <strong>Warning:</strong> First-time minor violations
                  </li>
                  <li>
                    <strong>Content Removal:</strong> Inappropriate posts or
                    profiles
                  </li>
                  <li>
                    <strong>Feature Restrictions:</strong> Limited messaging or
                    posting abilities
                  </li>
                  <li>
                    <strong>Temporary Suspension:</strong> Short-term account
                    restrictions
                  </li>
                  <li>
                    <strong>Permanent Ban:</strong> Serious or repeated
                    violations
                  </li>
                  <li>
                    <strong>Legal Action:</strong> For illegal activities
                  </li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">
                  7.3 Appeals Process
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  If you believe your account was incorrectly restricted, you
                  may appeal by contacting
                  <a
                    href="mailto:hello@apprenticeapex.co.uk"
                    className="text-orange hover:underline ml-1"
                  >
                    hello@apprenticeapex.co.uk
                  </a>
                  within 30 days of the action.
                </p>
              </section>

              {/* User Safety */}
              <section>
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#da6927" }}
                >
                  8. User Safety and Security
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  To maintain a safe environment:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Keep your personal information secure</li>
                  <li>Be cautious when sharing sensitive details</li>
                  <li>
                    Meet in public places for initial interviews when possible
                  </li>
                  <li>Trust your instincts about suspicious behavior</li>
                  <li>Report any safety concerns immediately</li>
                  <li>
                    Don't share financial information or pay fees for
                    applications
                  </li>
                </ul>
              </section>

              {/* Third-Party Services */}
              <section>
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#da6927" }}
                >
                  9. Third-Party Services
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  When using integrated third-party services (video calls,
                  payments, etc.):
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>You must also comply with their terms of service</li>
                  <li>
                    Report misuse of these services to us and the service
                    provider
                  </li>
                  <li>
                    Understand that these services have their own privacy
                    policies
                  </li>
                  <li>Use these services appropriately and professionally</li>
                </ul>
              </section>

              {/* Updates */}
              <section>
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#da6927" }}
                >
                  10. Policy Updates
                </h2>
                <p className="text-gray-300 leading-relaxed mb-6">
                  We may update this Policy to address new behaviors,
                  technologies, or legal requirements. Significant changes will
                  be communicated through our platform and email notifications.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#da6927" }}
                >
                  11. Contact Information
                </h2>
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    For questions about this Policy or to report violations:
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    <strong>General Inquiries:</strong>
                    <a
                      href="mailto:hello@apprenticeapex.co.uk"
                      className="text-orange hover:underline ml-1"
                    >
                      hello@apprenticeapex.co.uk
                    </a>
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
