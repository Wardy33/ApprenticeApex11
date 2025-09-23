import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Building2, Clock, MessageCircle } from "lucide-react";

interface Match {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  salary: string;
  image: string;
  matchPercentage: number;
  isNew: boolean;
}

function MatchesPage() {
  const [matches] = useState<Match[]>([
    {
      id: "1",
      title: "Software Developer Apprentice",
      company: "TechCorp Ltd",
      location: "London",
      duration: "36 months",
      salary: "£18,000 - £25,000",
      image: "/api/placeholder/300/200",
      matchPercentage: 95,
      isNew: true,
    },
    {
      id: "2",
      title: "Digital Marketing Apprentice",
      company: "Creative Agency",
      location: "Manchester",
      duration: "24 months",
      salary: "£16,000 - £22,000",
      image: "/api/placeholder/300/200",
      matchPercentage: 88,
      isNew: false,
    },
    // Add more sample data as needed
  ]);

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Your Matches</h1>
        <p className="text-gray-600 text-sm mt-1">
          {matches.length} apprenticeships matched your profile
        </p>
      </div>

      {/* Matches List */}
      <div className="p-6 space-y-4">
        {matches.map((match) => (
          <div
            key={match.id}
            className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex">
              {/* Image */}
              <div className="w-24 h-24 bg-gray-200 flex-shrink-0">
                <img
                  src={match.image}
                  alt={match.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* Content */}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {match.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{match.company}</p>
                  </div>
                  {match.isNew && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      New
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {match.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {match.duration}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {match.matchPercentage}% match
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/student/apprenticeship-info/${match.id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/student/chat/${match.id}`}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MatchesPage;
