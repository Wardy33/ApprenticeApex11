import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  AlertTriangle,
  User,
  MapPin,
  Briefcase,
  DollarSign,
  Car,
  Clock,
  CheckCircle,
} from "lucide-react";

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
  completionPercentage: number;
}

const FIELD_ICONS: { [key: string]: React.ReactNode } = {
  Location: <MapPin className="h-5 w-5" />,
  "Location coordinates": <MapPin className="h-5 w-5" />,
  "Industry preferences": <Briefcase className="h-5 w-5" />,
  "Salary expectations": <DollarSign className="h-5 w-5" />,
  "Maximum commute distance": <MapPin className="h-5 w-5" />,
  "Transport modes": <Car className="h-5 w-5" />,
  "Work type preference": <Clock className="h-5 w-5" />,
};

const FIELD_DESCRIPTIONS: { [key: string]: string } = {
  Location: "Add your city and postcode to find nearby jobs",
  "Location coordinates": "We need your location to calculate distances",
  "Industry preferences": "Select industries you're interested in",
  "Salary expectations": "Set your minimum and maximum salary expectations",
  "Maximum commute distance": "How far are you willing to travel for work?",
  "Transport modes":
    "How can you get to work? (walking, cycling, public transport, etc.)",
  "Work type preference": "Do you prefer full-time, part-time, or both?",
};

export default function ProfileCompletionModal({
  isOpen,
  onClose,
  missingFields,
  completionPercentage,
}: ProfileCompletionModalProps) {
  const navigate = useNavigate();
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCompleteProfile = () => {
    navigate("/candidate/setup-profile");
    onClose();
  };

  const handleExploreLater = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          showAnimation ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Complete Your Profile
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Profile Completion</span>
              <span className="font-semibold text-orange">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">
              To get the best job matches and apply for positions, we need a bit
              more information about you.
            </p>
            <p className="text-sm text-gray-500">
              This helps us show you the most relevant apprenticeships and
              calculate travel information.
            </p>
          </div>

          {/* Missing Fields */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Missing Information:
            </h3>
            {missingFields.map((field, index) => (
              <div
                key={field}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 text-orange mt-0.5">
                  {FIELD_ICONS[field] || <User className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">
                    {field}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {FIELD_DESCRIPTIONS[field] ||
                      "This information helps us match you with suitable jobs"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-orange/5 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 text-orange mr-2" />
              What you'll get:
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-orange rounded-full mr-2" />
                Personalized job recommendations with match percentages
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-orange rounded-full mr-2" />
                Travel time and route suggestions for each job
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-orange rounded-full mr-2" />
                Priority access to apply for apprenticeships
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-orange rounded-full mr-2" />
                Better visibility to employers looking for your skills
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCompleteProfile}
              className="w-full bg-orange hover:bg-orange/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Complete Profile Now (
              {Math.ceil(((7 - missingFields.length) / 7) * 5)} min)
            </button>
            <button
              onClick={handleExploreLater}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Explore Jobs (Limited Features)
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            You can complete your profile at any time by going to Settings ���
            Edit Profile
          </p>
        </div>
      </div>
    </div>
  );
}
