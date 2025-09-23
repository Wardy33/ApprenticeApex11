import { WebLayout } from "../../components/WebLayout";
import { SEOHead, seoConfigs } from "../../components/SEOHead";

export default function CookiePolicy() {
  return (
    <WebLayout>
      <SEOHead {...seoConfigs.cookiePolicy} />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center text-white drop-shadow-lg">
            Cookie Policy
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
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#da6927' }}>1. What Are Cookies?</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Cookies are small text files that are stored on your device when you visit our website.
                  They help us provide you with a better experience by remembering your preferences,
                  keeping you logged in, and helping us understand how you use our platform.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  This Cookie Policy explains what cookies we use, why we use them, and how you can
                  control them. This policy should be read alongside our
                  <a href="/privacy-policy" className="text-orange hover:underline"> Privacy Policy</a> and
                  <a href="/terms-of-service" className="text-orange hover:underline"> Terms of Service</a>.
                </p>
              </section>

              {/* Types of Cookies */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#da6927' }}>2. Types of Cookies We Use</h2>

                <h3 className="text-xl font-semibold mb-3 text-white">2.1 Essential Cookies</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  These cookies are necessary for our website to function properly and cannot be turned off.
                  They are usually only set in response to actions you take, such as logging in or filling out forms.
                </p>
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-white mb-2">Examples:</h4>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li><strong>Authentication:</strong> Keeping you logged in to your account</li>
                    <li><strong>Security:</strong> Protecting against fraudulent activity</li>
                    <li><strong>Load Balancing:</strong> Distributing traffic across our servers</li>
                    <li><strong>Form Data:</strong> Remembering information you've entered in forms</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold mb-3 text-white">2.2 Functional Cookies</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  These cookies enable enhanced functionality and personalization, such as remembering
                  your preferences and providing personalized content.
                </p>
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-white mb-2">Examples:</h4>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li><strong>Language Preferences:</strong> Remembering your chosen language</li>
                    <li><strong>Location Settings:</strong> Storing your location preferences for job matching</li>
                    <li><strong>Theme Preferences:</strong> Remembering your display preferences</li>
                    <li><strong>Notification Settings:</strong> Storing your communication preferences</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold mb-3 text-white">2.3 Analytics Cookies</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  These cookies help us understand how visitors interact with our website by collecting
                  and reporting information anonymously. This helps us improve our platform.
                </p>
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-white mb-2">Examples:</h4>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li><strong>Usage Analytics:</strong> Understanding which pages are most popular</li>
                    <li><strong>Performance Monitoring:</strong> Identifying technical issues</li>
                    <li><strong>User Journey Analysis:</strong> Understanding how users navigate our site</li>
                    <li><strong>Feature Usage:</strong> Measuring adoption of new features</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold mb-3 text-white">2.4 Marketing Cookies</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  These cookies track your activity across websites to help advertisers deliver more
                  relevant advertisements. We only use these with your explicit consent.
                </p>
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-white mb-2">Examples:</h4>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li><strong>Targeted Advertising:</strong> Showing relevant apprenticeship opportunities</li>
                    <li><strong>Retargeting:</strong> Reminding you to complete your profile</li>
                    <li><strong>Social Media:</strong> Enabling sharing and social features</li>
                    <li><strong>Campaign Tracking:</strong> Measuring effectiveness of our marketing</li>
                  </ul>
                </div>
              </section>

              {/* Specific Cookies */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#da6927' }}>3. Specific Cookies We Use</h2>

                <div className="overflow-x-auto mb-6">
                  <table className="w-full border border-gray-700 rounded-lg">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="border border-gray-700 p-3 text-left text-white">Cookie Name</th>
                        <th className="border border-gray-700 p-3 text-left text-white">Purpose</th>
                        <th className="border border-gray-700 p-3 text-left text-white">Duration</th>
                        <th className="border border-gray-700 p-3 text-left text-white">Type</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-300">
                      <tr>
                        <td className="border border-gray-700 p-3">auth_token</td>
                        <td className="border border-gray-700 p-3">Keeps you logged in</td>
                        <td className="border border-gray-700 p-3">7 days</td>
                        <td className="border border-gray-700 p-3">Essential</td>
                      </tr>
                      <tr className="bg-gray-800/30">
                        <td className="border border-gray-700 p-3">session_id</td>
                        <td className="border border-gray-700 p-3">Manages your session</td>
                        <td className="border border-gray-700 p-3">Session</td>
                        <td className="border border-gray-700 p-3">Essential</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-700 p-3">user_preferences</td>
                        <td className="border border-gray-700 p-3">Stores your settings</td>
                        <td className="border border-gray-700 p-3">1 year</td>
                        <td className="border border-gray-700 p-3">Functional</td>
                      </tr>
                      <tr className="bg-gray-800/30">
                        <td className="border border-gray-700 p-3">analytics_id</td>
                        <td className="border border-gray-700 p-3">Anonymous usage tracking</td>
                        <td className="border border-gray-700 p-3">2 years</td>
                        <td className="border border-gray-700 p-3">Analytics</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-700 p-3">marketing_consent</td>
                        <td className="border border-gray-700 p-3">Tracks marketing preferences</td>
                        <td className="border border-gray-700 p-3">1 year</td>
                        <td className="border border-gray-700 p-3">Marketing</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Third Party Cookies */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#da6927' }}>4. Third-Party Cookies</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We work with trusted third-party services that may set their own cookies.
                  These services help us provide better functionality and understand our users.
                </p>

                <h3 className="text-xl font-semibold mb-3 text-white">4.1 Service Providers</h3>
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Google Analytics</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      Helps us understand website usage and user behavior.
                    </p>
                    <p className="text-gray-300 text-sm">
                      <strong>Privacy Policy:</strong>
                      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-orange hover:underline ml-1">
                        Google Privacy Policy
                      </a>
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Stripe</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      Processes payments for employer subscriptions securely.
                    </p>
                    <p className="text-gray-300 text-sm">
                      <strong>Privacy Policy:</strong>
                      <a href="https://stripe.com/privacy" target="_blank" rel="noopener" className="text-orange hover:underline ml-1">
                        Stripe Privacy Policy
                      </a>
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Daily.co</h4>
                    <p className="text-gray-300 text-sm mb-2">
                      Enables video calling functionality for interviews.
                    </p>
                    <p className="text-gray-300 text-sm">
                      <strong>Privacy Policy:</strong>
                      <a href="https://www.daily.co/privacy/" target="_blank" rel="noopener" className="text-orange hover:underline ml-1">
                        Daily.co Privacy Policy
                      </a>
                    </p>
                  </div>
                </div>
              </section>

              {/* Cookie Consent */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#da6927' }}>5. Your Cookie Choices</h2>

                <h3 className="text-xl font-semibold mb-3 text-white">5.1 Cookie Consent</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  When you first visit our website, we'll ask for your consent to use non-essential cookies.
                  You can choose which types of cookies to accept:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li><strong>Accept All:</strong> Allows all cookies for the best experience</li>
                  <li><strong>Essential Only:</strong> Only allows necessary cookies</li>
                  <li><strong>Custom Settings:</strong> Choose specific cookie categories</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">5.2 Managing Your Preferences</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You can change your cookie preferences at any time:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Use our Cookie Preference Center (accessible from any page footer)</li>
                  <li>Update your account settings when logged in</li>
                  <li>Contact our support team for assistance</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-white">5.3 Browser Settings</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You can also control cookies through your browser settings:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                  <li><strong>Firefox:</strong> Preferences → Privacy & Security → Cookies</li>
                  <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                  <li><strong>Edge:</strong> Settings → Site Permissions → Cookies</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mb-6">
                  <strong>Note:</strong> Disabling essential cookies may affect website functionality.
                </p>
              </section>

              {/* Mobile Apps */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#da6927' }}>6. Mobile App Data</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Our mobile app uses similar tracking technologies to cookies, including:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li><strong>Local Storage:</strong> Storing app preferences and settings</li>
                  <li><strong>Analytics SDKs:</strong> Understanding app usage patterns</li>
                  <li><strong>Push Notifications:</strong> Sending relevant updates (with permission)</li>
                  <li><strong>Device Identifiers:</strong> For security and fraud prevention</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mb-6">
                  You can control these through your device settings and app permissions.
                </p>
              </section>

              {/* Data Subject Rights */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#da6927' }}>7. Your Rights</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Under UK data protection law, you have rights regarding cookies and tracking:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li><strong>Right to Object:</strong> Object to processing for marketing purposes</li>
                  <li><strong>Right to Withdraw Consent:</strong> Change your mind about cookie preferences</li>
                  <li><strong>Right of Access:</strong> Request information about cookies we've set</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of cookie-collected data</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mb-6">
                  To exercise these rights, contact us at
                  <a href="mailto:hello@apprenticeapex.co.uk" className="text-orange hover:underline ml-1">
                    hello@apprenticeapex.co.uk
                  </a>.
                </p>
              </section>

              {/* International Users */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#da6927' }}>8. International Users</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you're accessing our service from outside the UK:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Cookies may be transferred to and processed in the UK</li>
                  <li>We ensure appropriate safeguards for international transfers</li>
                  <li>Local privacy laws may provide additional rights</li>
                  <li>Contact us for information about your local rights</li>
                </ul>
              </section>

              {/* Updates */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#da6927' }}>9. Updates to This Policy</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may update this Cookie Policy to reflect:
                </p>
                <ul className="text-gray-300 space-y-2 mb-6 list-disc list-inside">
                  <li>Changes in cookie technology or our practices</li>
                  <li>Legal or regulatory requirements</li>
                  <li>New features or services</li>
                  <li>User feedback and improvements</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mb-6">
                  We'll notify you of significant changes through our platform or by email.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#da6927' }}>10. Contact Us</h2>
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    If you have questions about our use of cookies or this policy:
                  </p>
                  <p className="text-gray-300 leading-relaxed">
                    <strong>Email:</strong>
                    <a href="mailto:hello@apprenticeapex.co.uk" className="text-orange hover:underline ml-1">
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