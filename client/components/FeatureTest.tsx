import { useState } from "react";
import ProfileCompletionModal from "./ProfileCompletionModal";
import EnhancedSwipeCard from "./EnhancedSwipeCard";

// Test component to verify our enhanced features work
export default function FeatureTest() {
  const [showModal, setShowModal] = useState(false);

  // Note: This component is for internal testing and should not be visible to end users
  // Real data would be fetched from the API in production
  const testJobData = null; // Removed mock data for production
  const missingFields: string[] = []; // Would come from profile analysis API

  // Minimal mock data for internal testing
  const mockMatchedJob = {
    apprenticeshipId: "app_1",
    matchPercentage: 85,
    matchFactors: {
      location: 80,
      industry: 90,
      salary: 70,
      workType: 85,
      drivingLicense: 100,
      skills: 88,
      overall: 85,
    },
    travelInfo: {
      distance: 5,
      recommendedTransport: ["Public Transport"],
      estimatedTravelTime: "30 mins",
    },
    job: {
      _id: "job_1",
      jobTitle: "Junior Developer",
      description: "Entry-level software development role",
      industry: "Technology",
      location: {
        city: "London",
        address: "123 Tech Street",
        postcode: "EC1A 1AA",
      },
      salary: { min: 25000, max: 30000, currency: "GBP" },
      workType: "Hybrid",
      drivingLicenseRequired: false,
      accessibilitySupport: true,
      skills: ["JavaScript", "React", "Git"],
      duration: { years: 1, months: 6 },
    },
  };

  const mockMissingFields: string[] = ["profilePicture", "bio"];

  const handleSwipe = (direction: "left" | "right", jobId: string) => {
    console.log(`Swiped ${direction} on job ${jobId}`);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Feature Test Components</h2>

      <div className="space-y-4">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test Profile Completion Modal
        </button>

        <div className="max-w-sm mx-auto">
          <h3 className="text-lg font-semibold mb-4">
            Enhanced Swipe Card Test:
          </h3>
          <EnhancedSwipeCard
            matchedJob={mockMatchedJob}
            onSwipe={handleSwipe}
          />
        </div>
      </div>

      <ProfileCompletionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        missingFields={mockMissingFields}
        completionPercentage={60}
      />
    </div>
  );
}
