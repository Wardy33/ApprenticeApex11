import React, { useState, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, X, MapPin, Building2, Clock, Filter } from "lucide-react";

interface Apprenticeship {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  salary: string;
  image: string;
  description: string;
  closingDate: string;
}

// Helper function to check if application deadline has passed
const isApplicationClosed = (closingDate: string) => {
  const today = new Date();
  const deadline = new Date(closingDate);
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return deadline < today;
};

// Memoized SwipeCard component for better performance
const SwipeCard = memo(
  ({
    apprenticeship,
    onSwipe,
    style,
  }: {
    apprenticeship: Apprenticeship;
    onSwipe: (direction: "left" | "right") => void;
    style?: React.CSSProperties;
  }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragDistance, setDragDistance] = useState(0);

    const handleDragStart = useCallback(() => {
      setIsDragging(true);
    }, []);

    const handleDrag = useCallback(
      (e: React.MouseEvent) => {
        if (!isDragging) return;
        // Drag logic implementation
      },
      [isDragging],
    );

    const handleDragEnd = useCallback(() => {
      setIsDragging(false);
      if (Math.abs(dragDistance) > 100) {
        onSwipe(dragDistance > 0 ? "right" : "left");
      }
      setDragDistance(0);
    }, [dragDistance, onSwipe]);

    const cardStyle = useMemo(
      () => ({
        ...style,
        transform: `translateX(${dragDistance}px) rotate(${dragDistance * 0.1}deg)`,
        opacity: 1 - Math.abs(dragDistance) * 0.002,
        cursor: isDragging ? "grabbing" : "grab",
      }),
      [style, dragDistance, isDragging],
    );

    return (
      <div
        className="swipe-card absolute bg-white rounded-2xl shadow-2xl border border-gray-100 w-full h-[480px] sm:h-[520px] overflow-hidden select-none"
        style={cardStyle}
        onMouseDown={handleDragStart}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${apprenticeship.image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col">
          {/* Header Info */}
          <div className="p-6 flex-1 flex flex-col justify-end text-white">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">
                  {apprenticeship.company}
                </span>
              </div>
              <h2 className="text-2xl font-bold leading-tight">
                {apprenticeship.title}
              </h2>
              <div className="flex items-center gap-4 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {apprenticeship.location}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {apprenticeship.duration}
                </div>
              </div>
              <p className="text-lg font-semibold text-green-400">
                {apprenticeship.salary}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

SwipeCard.displayName = "SwipeCard";

function JobsPage() {
  const navigate = useNavigate();
  const [apprenticeships] = useState<Apprenticeship[]>([
    {
      id: "1",
      title: "Software Developer Apprentice",
      company: "TechCorp Ltd",
      location: "London",
      duration: "36 months",
      salary: "£18,000 - £25,000",
      image: "/api/placeholder/400/600",
      description: "Learn cutting-edge web development...",
      closingDate: "2024-03-15",
    },
    // Add more sample data as needed
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const handleButtonSwipe = (direction: "left" | "right") => {
    if (direction === "right") {
      console.log("Liked apprenticeship:", apprenticeships[currentIndex]);
    } else {
      console.log("Passed on apprenticeship:", apprenticeships[currentIndex]);
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const currentApprenticeship = apprenticeships[currentIndex];

  if (!currentApprenticeship) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No more apprenticeships
          </h2>
          <p className="text-gray-600 mb-4">
            Check back later for new opportunities!
          </p>
          <button
            onClick={() => setCurrentIndex(0)}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Browse Jobs</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Filter className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-sm mx-auto relative h-[520px]">
          <SwipeCard
            apprenticeship={currentApprenticeship}
            onSwipe={handleButtonSwipe}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <button
            onClick={() => handleButtonSwipe("left")}
            className="w-16 h-16 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="h-8 w-8 text-red-500" />
          </button>
          <button
            onClick={() =>
              navigate(
                `/student/apprenticeship-info/${currentApprenticeship.id}`,
              )
            }
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-700 font-medium transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => handleButtonSwipe("right")}
            className="w-16 h-16 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center transition-colors"
          >
            <Heart className="h-8 w-8 text-green-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default JobsPage;
