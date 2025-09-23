import { IUser, IStudentProfile } from "../models/User";
import { IApprenticeship } from "../models/Apprenticeship";

export interface MatchResult {
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
}

export interface TravelCalculation {
  distance: number; // in miles
  recommendedModes: string[];
  estimatedTime: string;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3959; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate travel information based on distance and student preferences
function calculateTravelInfo(
  distance: number,
  studentTransportModes: string[],
  studentHasLicense: boolean,
): TravelCalculation {
  const recommendedModes: string[] = [];
  let estimatedTime = "";

  if (distance <= 2) {
    // Walking distance
    if (studentTransportModes.includes("Walking")) {
      recommendedModes.push("Walking");
    }
    if (studentTransportModes.includes("Cycling")) {
      recommendedModes.push("Cycling");
    }
    estimatedTime = "15-30 minutes";
  } else if (distance <= 5) {
    // Cycling/short public transport
    if (studentTransportModes.includes("Cycling")) {
      recommendedModes.push("Cycling");
    }
    if (studentTransportModes.includes("Public Transport")) {
      recommendedModes.push("Public Transport");
    }
    if (studentHasLicense && studentTransportModes.includes("Car/Driving")) {
      recommendedModes.push("Car/Driving");
    }
    estimatedTime = "20-45 minutes";
  } else if (distance <= 15) {
    // Public transport/car
    if (studentTransportModes.includes("Public Transport")) {
      recommendedModes.push("Public Transport");
    }
    if (studentHasLicense && studentTransportModes.includes("Car/Driving")) {
      recommendedModes.push("Car/Driving");
    }
    if (studentTransportModes.includes("Motorcycle")) {
      recommendedModes.push("Motorcycle");
    }
    estimatedTime = "30-60 minutes";
  } else {
    // Long distance - mainly car/public transport
    if (studentHasLicense && studentTransportModes.includes("Car/Driving")) {
      recommendedModes.push("Car/Driving");
    }
    if (studentTransportModes.includes("Public Transport")) {
      recommendedModes.push("Public Transport (with connections)");
    }
    estimatedTime = "60+ minutes";
  }

  // If no suitable transport modes, suggest alternatives
  if (recommendedModes.length === 0) {
    if (distance <= 5) {
      recommendedModes.push("Consider cycling or public transport");
    } else {
      recommendedModes.push("Public transport recommended");
    }
  }

  return {
    distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
    recommendedModes,
    estimatedTime,
  };
}

// Calculate skill overlap between student and job
function calculateSkillMatch(
  studentSkills: string[],
  jobSkills: string[],
): number {
  if (jobSkills.length === 0) return 100; // No specific skills required
  if (studentSkills.length === 0) return 0; // Student has no skills

  const matchingSkills = studentSkills.filter((skill) =>
    jobSkills.some(
      (jobSkill) =>
        jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(jobSkill.toLowerCase()),
    ),
  );

  return Math.min(100, (matchingSkills.length / jobSkills.length) * 100);
}

// Calculate salary compatibility
function calculateSalaryMatch(
  studentMin: number,
  studentMax: number,
  jobMin: number,
  jobMax: number,
): number {
  // Check if there's any overlap between salary ranges
  const overlapMin = Math.max(studentMin, jobMin);
  const overlapMax = Math.min(studentMax, jobMax);

  if (overlapMin <= overlapMax) {
    // There's overlap - calculate how much
    const overlapRange = overlapMax - overlapMin;
    const studentRange = studentMax - studentMin;
    const jobRange = jobMax - jobMin;
    const avgRange = (studentRange + jobRange) / 2;

    if (avgRange === 0) return 100; // Exact match
    return Math.min(100, (overlapRange / avgRange) * 100);
  } else {
    // No overlap - calculate how close they are
    const gap = overlapMin - overlapMax;
    const avgSalary = (studentMin + studentMax + jobMin + jobMax) / 4;
    const gapPercentage = (gap / avgSalary) * 100;

    return Math.max(0, 100 - gapPercentage);
  }
}

// Main matching function
export function calculateJobMatch(
  student: IUser,
  apprenticeship: IApprenticeship,
): MatchResult {
  const studentProfile = student.profile as IStudentProfile;

  // Location matching (within commute distance)
  const distance = calculateDistance(
    studentProfile.location.coordinates[1], // latitude
    studentProfile.location.coordinates[0], // longitude
    apprenticeship.location.coordinates[1],
    apprenticeship.location.coordinates[0],
  );

  const locationScore =
    distance <= studentProfile.preferences.maxDistance
      ? Math.max(
          0,
          100 - (distance / studentProfile.preferences.maxDistance) * 50,
        )
      : 0;

  // Industry matching
  const industryScore = studentProfile.preferences.industries.includes(
    apprenticeship.industry,
  )
    ? 100
    : 0;

  // Salary matching
  const salaryScore = calculateSalaryMatch(
    studentProfile.preferences.salaryRange.min,
    studentProfile.preferences.salaryRange.max,
    apprenticeship.salary.min,
    apprenticeship.salary.max,
  );

  // Work type matching
  let workTypeScore = 0;
  if (
    apprenticeship.workType === "both" ||
    studentProfile.workType === "both"
  ) {
    workTypeScore = 100;
  } else if (apprenticeship.workType === studentProfile.workType) {
    workTypeScore = 100;
  } else {
    workTypeScore = 50; // Partial match
  }

  // Driving license matching
  let drivingLicenseScore = 100;
  if (
    apprenticeship.drivingLicenseRequired &&
    !studentProfile.hasDriversLicense
  ) {
    drivingLicenseScore = 0; // Hard requirement not met
  }

  // Skills matching
  const skillsScore = calculateSkillMatch(
    studentProfile.skills,
    apprenticeship.skills || [],
  );

  // Calculate weighted overall score
  const weights = {
    location: 0.25, // 25%
    industry: 0.2, // 20%
    salary: 0.2, // 20%
    workType: 0.15, // 15%
    drivingLicense: 0.1, // 10%
    skills: 0.1, // 10%
  };

  const overallScore =
    locationScore * weights.location +
    industryScore * weights.industry +
    salaryScore * weights.salary +
    workTypeScore * weights.workType +
    drivingLicenseScore * weights.drivingLicense +
    skillsScore * weights.skills;

  // Calculate travel information
  const travelInfo = calculateTravelInfo(
    distance,
    studentProfile.transportModes,
    studentProfile.hasDriversLicense,
  );

  return {
    apprenticeshipId: apprenticeship._id,
    matchPercentage: Math.round(overallScore),
    matchFactors: {
      location: Math.round(locationScore),
      industry: Math.round(industryScore),
      salary: Math.round(salaryScore),
      workType: Math.round(workTypeScore),
      drivingLicense: Math.round(drivingLicenseScore),
      skills: Math.round(skillsScore),
      overall: Math.round(overallScore),
    },
    travelInfo: {
      distance: travelInfo.distance,
      recommendedTransport: travelInfo.recommendedModes,
      estimatedTravelTime: travelInfo.estimatedTime,
    },
  };
}

// Function to get sorted matches for a student
export function getMatchedJobs(
  student: IUser,
  apprenticeships: IApprenticeship[],
): MatchResult[] {
  const matches = apprenticeships
    .filter((job) => job.isActive)
    .map((job) => calculateJobMatch(student, job))
    .filter((match) => match.matchPercentage > 0) // Only show jobs with some compatibility
    .sort((a, b) => b.matchPercentage - a.matchPercentage); // Sort by match percentage (highest first)

  return matches;
}

// Function to check if profile is complete enough for job matching
export function isProfileCompleteForMatching(student: IUser): {
  isComplete: boolean;
  missingFields: string[];
} {
  const profile = student.profile as IStudentProfile;
  const missingFields: string[] = [];

  if (!profile.location.city) missingFields.push("Location");
  if (
    !profile.location.coordinates ||
    profile.location.coordinates.length !== 2
  ) {
    missingFields.push("Location coordinates");
  }
  if (
    !profile.preferences.industries ||
    profile.preferences.industries.length === 0
  ) {
    missingFields.push("Industry preferences");
  }
  if (
    !profile.preferences.salaryRange.min ||
    !profile.preferences.salaryRange.max
  ) {
    missingFields.push("Salary expectations");
  }
  if (!profile.preferences.maxDistance) {
    missingFields.push("Maximum commute distance");
  }
  if (!profile.transportModes || profile.transportModes.length === 0) {
    missingFields.push("Transport modes");
  }
  if (!profile.workType) {
    missingFields.push("Work type preference");
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}
