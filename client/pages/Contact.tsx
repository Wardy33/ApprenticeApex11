import { useState } from "react";
import { WebLayout } from "../components/WebLayout";
import { SEOHead } from "../components/SEOHead";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Users,
  Building2,
} from "lucide-react";
import { LoadingButton } from "../components/ui/loading";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    userType: "student",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send form data to backend API
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          recipient: "hello@apprenticeapex.co.uk",
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        console.error("Failed to send message");
        alert(
          "Failed to send message. Please try again or email us directly at hello@apprenticeapex.co.uk",
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert(
        "Failed to send message. Please try again or email us directly at hello@apprenticeapex.co.uk",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <WebLayout>
      <SEOHead
        title="Contact Us - Get Help & Support | ApprenticeApex"
        description="Get in touch with ApprenticeApex for support, partnerships, or general inquiries. We're here to help students and employers succeed."
        keywords="contact apprenticeapex, customer support, help center, partnership inquiries"
      />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Get in{" "}
            <span className="bg-gradient-to-r from-blue-400 via-pink-500 to-orange-500 bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto font-medium">
            We're here to help you succeed. Whether you're a candidate looking
            for guidance or an employer seeking the perfect apprentices, we'd
            love to hear from you
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Contact Information
              </h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 mt-1 text-orange-400" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">Email</h3>
                    <p className="text-gray-300 text-sm mb-1">
                      General inquiries
                    </p>
                    <a
                      href="mailto:hello@apprenticeapex.co.uk"
                      className="text-orange-400 hover:text-orange-300 transition-colors hover:underline"
                    >
                      hello@apprenticeapex.co.uk
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="h-6 w-6 mt-1 text-cyan-400" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      Support Hours
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Monday - Friday: 9:00 AM - 6:00 PM GMT
                      <br />
                      Saturday: 10:00 AM - 4:00 PM GMT
                      <br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Options */}
            <div className="rounded-2xl p-6 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 border border-white/20 shadow-xl backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4 text-white">Quick Help</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="font-medium text-white text-sm">
                      For Candidates
                    </p>
                    <p className="text-gray-300 text-xs">
                      Account help, profile setup, applications
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white text-sm">
                      For Employers
                    </p>
                    <p className="text-gray-300 text-xs">
                      Posting jobs, candidate management, billing
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-5 w-5 text-pink-400" />
                  <div>
                    <p className="font-medium text-white text-sm">Live Chat</p>
                    <p className="text-gray-300 text-xs">
                      Instant support during business hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl p-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-white/10 shadow-xl backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                Send us a Message
              </h2>

              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Thank you for contacting us. We'll get back to you within 24
                    hours
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        subject: "",
                        message: "",
                        userType: "candidate",
                      });
                    }}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* User Type */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      I am a...
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="userType"
                          value="candidate"
                          checked={formData.userType === "candidate"}
                          onChange={(e) =>
                            handleInputChange("userType", e.target.value)
                          }
                          className="text-orange-500 border-gray-300 focus:ring-orange-500 bg-white"
                        />
                        <span className="text-gray-300">Candidate</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="userType"
                          value="employer"
                          checked={formData.userType === "employer"}
                          onChange={(e) =>
                            handleInputChange("userType", e.target.value)
                          }
                          className="text-orange-500 border-gray-300 focus:ring-orange-500 bg-white"
                        />
                        <span className="text-gray-300">Employer ���</span>
                      </label>
                    </div>
                  </div>

                  {/* Name and Email */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-white/90 border border-gray-300 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-white/90 border border-gray-300 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) =>
                        handleInputChange("subject", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white/90 border border-gray-300 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50"
                      placeholder="What can we help you with?"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) =>
                        handleInputChange("message", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white/90 border border-gray-300 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 resize-vertical"
                      placeholder="Please provide as much detail as possible..."
                    />
                  </div>

                  {/* Submit Button */}
                  <LoadingButton
                    type="submit"
                    isLoading={isSubmitting}
                    loadingText="Sending Message..."
                    className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 hover:scale-105 shadow-xl"
                  >
                    Send Message
                  </LoadingButton>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I create a candidate account?
                </h3>
                <p className="text-gray-300 text-sm">
                  Simply click "Sign Up" and choose "Candidate Account". You'll
                  need to provide basic information and can complete your
                  profile at your own pace.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is ApprenticeApex free for candidates?
                </h3>
                <p className="text-gray-300 text-sm">
                  Yes! Our core matching and application services are completely
                  free for candidates. We believe in removing barriers to career
                  opportunities.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does the matching algorithm work?
                </h3>
                <p className="text-gray-300 text-sm">
                  Our AI considers your location, skills, preferences, and
                  career goals to suggest the most suitable apprenticeship
                  opportunities with match percentages.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How much does it cost for employers?
                </h3>
                <p className="text-gray-300 text-sm">
                  We offer flexible pricing plans for employers, including free
                  options for small businesses. Contact us for detailed pricing
                  information.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I edit my application after submitting?
                </h3>
                <p className="text-gray-300 text-sm">
                  Once submitted, applications cannot be edited, but you can
                  update your profile anytime. This ensures all applications are
                  timestamped and authentic.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How long does the application process take?
                </h3>
                <p className="text-gray-300 text-sm">
                  This varies by employer, but most respond within 1-2 weeks.
                  You'll receive notifications throughout the process to keep
                  you updated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WebLayout>
  );
}
