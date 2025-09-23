import { useState, useRef } from "react";
import {
  Heart,
  X,
  MapPin,
  Building2,
  Clock,
  Star,
  Car,
  Bus,
  Navigation,
  Route,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
} from "lucide-react";

interface MatchedJob {
  apprenticeshipId: string;
  matchPercentage: number;
  matchFactors: {
    location: number;
    industry: number;
    salary: number;
    workType: number;
    drivingLicense: number;
    skills: number;
    overall: number;
  };
  travelInfo: {
    distance: number;
    recommendedTransport: string[];
    estimatedTravelTime: string;
  };
  job: {
    _id: string;
    jobTitle: string;
    description: string;
    industry: string;
    location: {
      city: string;
      address: string;
      postcode: string;
    };
    salary: {
      min: number;
      max: number;
      currency: string;
    };
    workType: string;
    drivingLicenseRequired: boolean;
    accessibilitySupport: boolean;
    skills: string[];
    duration: {
      years: number;
      months: number;
    };
  };
}

interface EnhancedSwipeCardProps {
  matchedJob: MatchedJob;
  onSwipe: (direction: "left" | "right", jobId: string) => void;
  style?: React.CSSProperties;
}

const TRANSPORT_ICONS: { [key: string]: React.ReactNode } = {
  Walking: <Navigation className="h-4 w-4" />,
  Cycling: <Navigation className="h-4 w-4" />,
  "Public Transport": <Bus className="h-4 w-4" />,
  "Car/Driving": <Car className="h-4 w-4" />,
  Motorcycle: <Car className="h-4 w-4" />,
};

export default function EnhancedSwipeCard({
  matchedJob,
  onSwipe,
  style,
}: EnhancedSwipeCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { job, matchPercentage, matchFactors, travelInfo } = matchedJob;

  const handleDragStart = () => setIsDragging(true);

  const handleDragEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragDistance) > 100) {
      onSwipe(dragDistance > 0 ? "right" : "left", job._id);
    }
    setDragDistance(0);
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const distance = e.clientX - (rect.left + rect.width / 2);
      setDragDistance(distance);
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 bg-green-100";
    if (percentage >= 60) return "text-orange bg-orange/10";
    if (percentage >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const formatSalary = () => {
    return `£${job.salary.min.toLocaleString()} - £${job.salary.max.toLocaleString()}`;
  };

  const formatDuration = () => {
    if (job.duration.years > 0 && job.duration.months > 0) {
      return `${job.duration.years}y ${job.duration.months}m`;
    } else if (job.duration.years > 0) {
      return `${job.duration.years} year${job.duration.years > 1 ? "s" : ""}`;
    } else {
      return `${job.duration.months} month${job.duration.months > 1 ? "s" : ""}`;
    }
  };

  return (
    <>
      <div
        ref={cardRef}
        className={`relative w-full h-[600px] bg-white rounded-2xl shadow-lg overflow-hidden cursor-grab ${
          isDragging ? "cursor-grabbing" : ""
        }`}
        style={{
          ...style,
          transform: `translateX(${dragDistance}px) rotate(${dragDistance / 10}deg)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Match Percentage Badge */}
        <div className="absolute top-4 right-4 z-10">
          <div
            className={`px-3 py-2 rounded-full font-bold text-sm ${getMatchColor(
              matchPercentage,
            )}`}
          >
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4" />
              <span>{matchPercentage}% Match</span>
            </div>
          </div>
        </div>

        {/* Header Image/Gradient */}
        <div className="h-48 bg-gradient-to-br from-orange to-orange/80 relative">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-4 left-4 text-white">
            <h2 className="text-2xl font-bold mb-1">{job.jobTitle}</h2>
            <div className="flex items-center space-x-2 text-white/90">
              <Building2 className="h-4 w-4" />
              <span>Company Name</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Location and Travel Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">
                  {job.location.city}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {travelInfo.distance} miles away
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {travelInfo.estimatedTravelTime}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {travelInfo.recommendedTransport
                  .slice(0, 2)
                  .map((mode, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-1 bg-white px-2 py-1 rounded text-xs text-gray-600"
                    >
                      {TRANSPORT_ICONS[mode] || (
                        <Navigation className="h-3 w-3" />
                      )}
                      <span className="hidden sm:inline">{mode}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm text-gray-600">Salary</div>
                <div className="font-semibold text-gray-900">
                  {formatSalary()}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Duration</div>
                <div className="font-semibold text-gray-900">
                  {formatDuration()}
                </div>
              </div>
            </div>
          </div>

          {/* Job Requirements */}
          <div>
            <div className="text-sm text-gray-600 mb-2">Key Requirements:</div>
            <div className="flex flex-wrap gap-2">
              {job.skills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                >
                  {skill}
                </span>
              ))}
              {job.skills.length > 3 && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  +{job.skills.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Special Requirements */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              {job.drivingLicenseRequired && (
                <div className="flex items-center space-x-1 text-orange">
                  <Car className="h-4 w-4" />
                  <span>License Required</span>
                </div>
              )}
              {job.accessibilitySupport && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Accessible</span>
                </div>
              )}
            </div>
            <div className="text-gray-600 capitalize">{job.workType}</div>
          </div>

          {/* Description Preview */}
          <div>
            <p className="text-gray-700 text-sm line-clamp-2">
              {job.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onSwipe("left", job._id)}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <button
              onClick={() => setShowDetails(true)}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium transition-colors"
            >
              More Details
            </button>

            <button
              onClick={() => onSwipe("right", job._id)}
              className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <Heart className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Swipe Indicators */}
        {isDragging && (
          <>
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                dragDistance > 50 ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="bg-green-500 text-white px-8 py-4 rounded-2xl font-bold text-xl transform rotate-12">
                LIKE
              </div>
            </div>
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                dragDistance < -50 ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="bg-red-500 text-white px-8 py-4 rounded-2xl font-bold text-xl transform -rotate-12">
                PASS
              </div>
            </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Match Details
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Match Breakdown */}
              <div className="space-y-4">
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold ${getMatchColor(matchPercentage).split(" ")[0]}`}
                  >
                    {matchPercentage}%
                  </div>
                  <div className="text-gray-600">Overall Match</div>
                </div>

                <div className="space-y-3">
                  {Object.entries(matchFactors)
                    .filter(([key]) => key !== "overall")
                    .map(([category, score]) => (
                      <div
                        key={category}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-600 capitalize">
                          {category === "drivingLicense"
                            ? "Driving License"
                            : category}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange h-2 rounded-full"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">
                            {score}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Travel Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Travel Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>Distance: {travelInfo.distance} miles</div>
                    <div>Travel time: {travelInfo.estimatedTravelTime}</div>
                    <div>
                      Recommended transport:{" "}
                      {travelInfo.recommendedTransport.join(", ")}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      onSwipe("left", job._id);
                      setShowDetails(false);
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium"
                  >
                    Pass
                  </button>
                  <button
                    onClick={() => {
                      onSwipe("right", job._id);
                      setShowDetails(false);
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
