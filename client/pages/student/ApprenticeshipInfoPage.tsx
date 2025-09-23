import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Clock,
  Heart,
  MessageCircle,
  Info,
} from "lucide-react";

interface ApprenticeshipDetails {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  salary: string;
  image: string;
  description: string;
  requirements: string[];
  benefits: string[];
  closingDate: string;
}

function ApprenticeshipInfoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apprenticeship] = useState<ApprenticeshipDetails>({
    id: id || "1",
    title: "Software Developer Apprentice",
    company: "TechCorp Ltd",
    location: "London",
    duration: "36 months",
    salary: "£18,000 - £25,000",
    image: "/api/placeholder/400/300",
    description:
      "Join our dynamic team and learn cutting-edge web development technologies while working on real-world projects. This apprenticeship combines hands-on experience with formal training to kickstart your career in software development.",
    requirements: [
      "A-levels or equivalent qualifications",
      "Strong problem-solving skills",
      "Interest in technology and programming",
      "Good communication skills",
      "Willingness to learn and adapt",
    ],
    benefits: [
      "Competitive salary with annual increases",
      "Mentorship from experienced developers",
      "Full-time employment upon completion",
      "Industry-recognized qualifications",
      "Flexible working arrangements",
      "Health and wellness benefits",
    ],
    closingDate: "2024-03-15",
  });

  const handleApply = () => {
    // Handle application logic
    console.log("Applying to apprenticeship:", apprenticeship.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            Apprenticeship Details
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Hero Section */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <img
            src={apprenticeship.image}
            alt={apprenticeship.title}
            className="w-full h-48 object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-orange-500" />
              <span className="text-orange-500 font-medium">
                {apprenticeship.company}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {apprenticeship.title}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{apprenticeship.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{apprenticeship.duration}</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-bold text-green-600">
                {apprenticeship.salary}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Description
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {apprenticeship.description}
          </p>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Requirements
          </h3>
          <ul className="space-y-2">
            {apprenticeship.requirements.map((requirement, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-gray-600">{requirement}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
          <ul className="space-y-2">
            {apprenticeship.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-gray-600">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleApply}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Apply Now
          </button>
          <button className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
            <Heart className="h-6 w-6 text-gray-600" />
          </button>
          <button className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
            <MessageCircle className="h-6 w-6 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApprenticeshipInfoPage;
