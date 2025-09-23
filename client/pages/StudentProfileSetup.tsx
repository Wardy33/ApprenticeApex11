import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  User,
} from "lucide-react";

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrently: boolean;
  description: string;
}

interface GCSEGrade {
  id: string;
  subject: string;
  grade: string;
  examBoard: string;
  year: string;
}

interface ProfileData {
  // Personal Info
  bio: string;
  dateOfBirth: string;
  phone: string;
  location: string;
  postcode: string;
  skills: string[];
  hasDriversLicense: boolean;
  assistedNeeds: string;

  // Work Experience
  experiences: Experience[];

  // GCSE Grades
  gcseGrades: GCSEGrade[];

  // Preferences
  interestedIndustries: string[];
  availabilityDate: string;
  workType: "full-time" | "part-time" | "both";
  salaryExpectation: {
    min: number;
    max: number;
  };
  maxCommuteDistance: number;
  transportModes: string[];
}

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Engineering",
  "Marketing",
  "Education",
  "Manufacturing",
  "Retail",
  "Construction",
  "Hospitality",
];

const TRANSPORT_MODES = [
  "Walking",
  "Cycling",
  "Public Transport",
  "Car/Driving",
  "Motorcycle",
];

const WORK_TYPE_OPTIONS = [
  { value: "full-time", label: "Full-time only" },
  { value: "part-time", label: "Part-time only" },
  { value: "both", label: "Both full-time and part-time" },
];

const GCSE_GRADES = ["9", "8", "7", "6", "5", "4", "3", "2", "1", "U"];
const EXAM_BOARDS = ["AQA", "Edexcel", "OCR", "WJEC", "CCEA"];

function ProfileSetupStep1({
  data,
  onUpdate,
  onNext,
}: {
  data: ProfileData;
  onUpdate: (updates: Partial<ProfileData>) => void;
  onNext: () => void;
}) {
  const [skillInput, setSkillInput] = useState("");

  const addSkill = () => {
    if (skillInput.trim() && !data.skills.includes(skillInput.trim())) {
      onUpdate({ skills: [...data.skills, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    onUpdate({ skills: data.skills.filter((s) => s !== skill) });
  };

  const handleNext = () => {
    if (data.bio && data.dateOfBirth && data.location && data.postcode) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <GraduationCap className="h-16 w-16 mx-auto mb-4" style={{color: '#da6927'}} />
        <h2 className="text-2xl font-bold mb-2" style={{color: '#020202'}}>
          Personal Information
        </h2>
        <p className="text-gray-600">Tell us about yourself</p>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Bio <span className="text-red-400">*</span>
        </label>
        <textarea
          value={data.bio}
          onChange={(e) => onUpdate({ bio: e.target.value })}
          placeholder="Write a brief description about yourself, your interests, and career goals..."
          className="w-full p-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none resize-none h-24"
          style={{borderColor: '#da6927'}}
          maxLength={300}
        />
        <p className="text-xs text-gray-500 mt-1">
          {data.bio.length}/300 characters
        </p>
      </div>

      {/* Date of Birth */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Date of Birth <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => onUpdate({ dateOfBirth: e.target.value })}
            className="w-full pl-10 pr-4 py-4 bg-white border border-gray-300 rounded-lg text-black focus:outline-none"
            style={{
              borderColor: '#da6927',
              fontSize: '18px',
              minHeight: '56px',
              WebkitAppearance: 'none',
              MozAppearance: 'textfield'
            }}
            max={new Date().toISOString().split('T')[0]}
            min="1900-01-01"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => onUpdate({ phone: e.target.value })}
          placeholder="07123 456789"
          className="w-full p-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none"
          style={{borderColor: '#da6927'}}
        />
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            City/Town <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={data.location}
              onChange={(e) => onUpdate({ location: e.target.value })}
              placeholder="London"
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none"
              style={{borderColor: '#da6927'}}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Postcode <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={data.postcode}
            onChange={(e) =>
              onUpdate({ postcode: e.target.value.toUpperCase() })
            }
            placeholder="SW1A 1AA"
            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none"
            style={{borderColor: '#da6927'}}
            maxLength={8}
          />
        </div>
      </div>

      {/* Driving License */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Do you have a driving license? <span className="text-red-400">*</span>
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="drivingLicense"
              checked={data.hasDriversLicense === true}
              onChange={() => onUpdate({ hasDriversLicense: true })}
              className="w-4 h-4 border-gray-300 focus:ring-orange-500"
              style={{color: '#da6927', backgroundColor: 'white'}}
            />
            <span className="text-black">Yes</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="drivingLicense"
              checked={data.hasDriversLicense === false}
              onChange={() => onUpdate({ hasDriversLicense: false })}
              className="w-4 h-4 border-gray-300 focus:ring-orange-500"
              style={{color: '#da6927', backgroundColor: 'white'}}
            />
            <span className="text-black">No</span>
          </label>
        </div>
      </div>

      {/* Assisted Needs */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Do you require any workplace adjustments or support?
        </label>
        <textarea
          value={data.assistedNeeds}
          onChange={(e) => onUpdate({ assistedNeeds: e.target.value })}
          placeholder="Please describe any adjustments you may need (e.g., wheelchair access, hearing support, flexible hours). Leave blank if none required."
          className="w-full p-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none resize-none h-20"
          style={{borderColor: '#da6927'}}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">
          {data.assistedNeeds.length}/500 characters
        </p>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Skills
        </label>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addSkill()}
              placeholder="Add a skill (e.g., JavaScript, Communication)"
              className="flex-1 p-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none"
              style={{borderColor: '#da6927'}}
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-3 text-white rounded-lg hover:opacity-90"
              style={{backgroundColor: '#da6927'}}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {data.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1 text-white rounded-full text-sm"
                  style={{backgroundColor: '#f8f9fa', color: '#020202', border: '1px solid #dee2e6'}}
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="text-gray-500 hover:text-black ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={
          !data.bio ||
          !data.dateOfBirth ||
          !data.location ||
          !data.postcode ||
          data.hasDriversLicense === undefined
        }
        className="w-full disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        style={{backgroundColor: '#da6927'}}
      >
        Next: Work Experience
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

function ProfileSetupStep2({
  data,
  onUpdate,
  onNext,
  onBack,
}: {
  data: ProfileData;
  onUpdate: (updates: Partial<ProfileData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const addExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      isCurrently: false,
      description: "",
    };
    onUpdate({ experiences: [...data.experiences, newExperience] });
  };

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    onUpdate({
      experiences: data.experiences.map((exp) =>
        exp.id === id ? { ...exp, ...updates } : exp,
      ),
    });
  };

  const removeExperience = (id: string) => {
    onUpdate({
      experiences: data.experiences.filter((exp) => exp.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Briefcase className="h-16 w-16 mx-auto mb-4" style={{color: '#da6927'}} />
        <h2 className="text-2xl font-bold mb-2" style={{color: '#020202'}}>Work Experience</h2>
        <p className="text-gray-600">
          Add your work experience and internships
        </p>
      </div>

      {data.experiences.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No work experience added yet</p>
          <p className="text-sm text-gray-500 mb-6">
            Include part-time jobs, internships, volunteering, or work
            experience placements
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.experiences.map((experience) => (
            <div key={experience.id} className="rounded-lg p-4 border border-gray-200" style={{backgroundColor: '#f8f9fa'}}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium" style={{color: '#020202'}}>Work Experience</h3>
                <button
                  onClick={() => removeExperience(experience.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Company name"
                  value={experience.company}
                  onChange={(e) =>
                    updateExperience(experience.id, { company: e.target.value })
                  }
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none"
                  style={{borderColor: '#da6927'}}
                />
                <input
                  type="text"
                  placeholder="Job title/position"
                  value={experience.position}
                  onChange={(e) =>
                    updateExperience(experience.id, {
                      position: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none"
                  style={{borderColor: '#da6927'}}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-black mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={experience.startDate}
                    onChange={(e) =>
                      updateExperience(experience.id, {
                        startDate: e.target.value,
                      })
                    }
                    className="w-full p-4 bg-white border border-gray-300 rounded-lg text-black focus:outline-none"
                    style={{
                      borderColor: '#da6927',
                      fontSize: '16px',
                      minHeight: '48px'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-black mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={experience.endDate}
                    disabled={experience.isCurrently}
                    onChange={(e) =>
                      updateExperience(experience.id, {
                        endDate: e.target.value,
                      })
                    }
                    className="w-full p-4 bg-white border border-gray-300 rounded-lg text-black focus:outline-none disabled:opacity-50"
                    style={{
                      borderColor: '#da6927',
                      fontSize: '16px',
                      minHeight: '48px'
                    }}
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={experience.isCurrently}
                  onChange={(e) =>
                    updateExperience(experience.id, {
                      isCurrently: e.target.checked,
                      endDate: e.target.checked ? "" : experience.endDate,
                    })
                  }
                  className="w-4 h-4 border-gray-300 rounded focus:ring-orange-500"
                  style={{color: '#da6927', backgroundColor: 'white'}}
                />
                <span className="text-sm text-black">
                  I currently work here
                </span>
              </label>

              <textarea
                placeholder="Describe your responsibilities and achievements..."
                value={experience.description}
                onChange={(e) =>
                  updateExperience(experience.id, {
                    description: e.target.value,
                  })
                }
                className="w-full p-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none resize-none h-20"
                style={{borderColor: '#da6927'}}
                maxLength={200}
              />
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addExperience}
        className="w-full border-2 border-dashed border-gray-300 hover:border-orange-500 text-gray-600 py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 hover:text-orange-500"
      >
        <Plus className="h-5 w-5" />
        Add Work Experience
      </button>

      <div className="space-y-3">
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <button
            onClick={onNext}
            className="flex-1 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            style={{backgroundColor: '#da6927'}}
          >
            Next: GCSE Grades
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={onNext}
          className="w-full bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Skip for now (you can add this later)
        </button>
      </div>
    </div>
  );
}

function ProfileSetupStep3({
  data,
  onUpdate,
  onNext,
  onBack,
}: {
  data: ProfileData;
  onUpdate: (updates: Partial<ProfileData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const addGCSEGrade = () => {
    const newGrade: GCSEGrade = {
      id: Date.now().toString(),
      subject: "",
      grade: "",
      examBoard: "",
      year: "",
    };
    onUpdate({ gcseGrades: [...data.gcseGrades, newGrade] });
  };

  const updateGCSEGrade = (id: string, updates: Partial<GCSEGrade>) => {
    onUpdate({
      gcseGrades: data.gcseGrades.map((grade) =>
        grade.id === id ? { ...grade, ...updates } : grade,
      ),
    });
  };

  const removeGCSEGrade = (id: string) => {
    onUpdate({
      gcseGrades: data.gcseGrades.filter((grade) => grade.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <GraduationCap className="h-16 w-16 mx-auto mb-4" style={{color: '#da6927'}} />
        <h2 className="text-2xl font-bold mb-2" style={{color: '#020202'}}>GCSE Grades</h2>
        <p className="text-gray-600">Add your GCSE results</p>
      </div>

      {data.gcseGrades.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No GCSE grades added yet</p>
          <p className="text-sm text-gray-500 mb-6">
            Add your GCSE grades to help employers understand your academic
            background
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.gcseGrades.map((grade) => (
            <div key={grade.id} className="rounded-lg p-4 border border-gray-200" style={{backgroundColor: '#f8f9fa'}}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium" style={{color: '#020202'}}>GCSE Subject</h3>
                <button
                  onClick={() => removeGCSEGrade(grade.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Subject (e.g., Mathematics)"
                  value={grade.subject}
                  onChange={(e) =>
                    updateGCSEGrade(grade.id, { subject: e.target.value })
                  }
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none"
                  style={{borderColor: '#da6927'}}
                />
                <select
                  value={grade.grade}
                  onChange={(e) =>
                    updateGCSEGrade(grade.id, { grade: e.target.value })
                  }
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg text-black focus:outline-none"
                  style={{borderColor: '#da6927'}}
                >
                  <option value="">Select Grade</option>
                  {GCSE_GRADES.map((gradeOption) => (
                    <option key={gradeOption} value={gradeOption}>
                      Grade {gradeOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={grade.examBoard}
                  onChange={(e) =>
                    updateGCSEGrade(grade.id, { examBoard: e.target.value })
                  }
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg text-black focus:outline-none"
                  style={{borderColor: '#da6927'}}
                >
                  <option value="">Select Exam Board</option>
                  {EXAM_BOARDS.map((board) => (
                    <option key={board} value={board}>
                      {board}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Year (e.g., 2023)"
                  value={grade.year}
                  onChange={(e) =>
                    updateGCSEGrade(grade.id, { year: e.target.value })
                  }
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none"
                  style={{borderColor: '#da6927'}}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addGCSEGrade}
        className="w-full border-2 border-dashed border-gray-300 hover:border-orange-500 text-gray-600 py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 hover:text-orange-500"
      >
        <Plus className="h-5 w-5" />
        Add GCSE Grade
      </button>

      <div className="space-y-3">
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <button
            onClick={onNext}
            className="flex-1 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            style={{backgroundColor: '#da6927'}}
          >
            Next: Preferences
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={onNext}
          className="w-full bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Skip for now (you can add this later)
        </button>
      </div>
    </div>
  );
}

function ProfileSetupStep4({
  data,
  onUpdate,
  onComplete,
  onBack,
}: {
  data: ProfileData;
  onUpdate: (updates: Partial<ProfileData>) => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const toggleIndustry = (industry: string) => {
    const newIndustries = data.interestedIndustries.includes(industry)
      ? data.interestedIndustries.filter((i) => i !== industry)
      : [...data.interestedIndustries, industry];
    onUpdate({ interestedIndustries: newIndustries });
  };

  const toggleTransportMode = (mode: string) => {
    const newModes = data.transportModes.includes(mode)
      ? data.transportModes.filter((m) => m !== mode)
      : [...data.transportModes, mode];
    onUpdate({ transportModes: newModes });
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Mock API call to save profile
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Navigate to main student app
      navigate("/candidate/home");
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="h-16 w-16 mx-auto mb-4" style={{color: '#da6927'}} />
        <h2 className="text-2xl font-bold mb-2" style={{color: '#020202'}}>Preferences</h2>
        <p className="text-gray-600">Tell us what you're looking for</p>
      </div>

      {/* Industries */}
      <div>
        <label className="block text-sm font-medium text-black mb-4">
          Which industries interest you? <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {INDUSTRIES.map((industry) => (
            <button
              key={industry}
              type="button"
              onClick={() => toggleIndustry(industry)}
              className={`p-3 rounded-lg border-2 transition-colors text-sm font-medium ${
                data.interestedIndustries.includes(industry)
                  ? "bg-orange-50 text-black"
                  : "border-gray-300 text-gray-700 hover:border-gray-400"
              }`}
              style={{
                ...(data.interestedIndustries.includes(industry)
                  ? {borderColor: '#da6927', backgroundColor: '#fef3e2'}
                  : {})
              }}
            >
              {industry}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Select all that apply. You can change these later.
        </p>
      </div>

      {/* Work Type Preference */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-4">
          What type of work are you looking for?{" "}
          <span className="text-red-400">*</span>
        </label>
        <div className="space-y-3">
          {WORK_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="radio"
                name="workType"
                value={option.value}
                checked={data.workType === option.value}
                onChange={(e) =>
                  onUpdate({
                    workType: e.target.value as
                      | "full-time"
                      | "part-time"
                      | "both",
                  })
                }
                className="w-4 h-4 text-orange border-gray-600 focus:ring-orange bg-gray-800"
              />
              <span className="text-gray-300">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Salary Expectations */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Salary Expectations (per year) <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Minimum</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                £
              </span>
              <input
                type="number"
                value={data.salaryExpectation.min || ""}
                onChange={(e) =>
                  onUpdate({
                    salaryExpectation: {
                      ...data.salaryExpectation,
                      min: parseInt(e.target.value) || 0,
                    },
                  })
                }
                placeholder="15000"
                className="w-full pl-8 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none"
                style={{borderColor: '#da6927'}}
                min="0"
                max="100000"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Maximum</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                £
              </span>
              <input
                type="number"
                value={data.salaryExpectation.max || ""}
                onChange={(e) =>
                  onUpdate({
                    salaryExpectation: {
                      ...data.salaryExpectation,
                      max: parseInt(e.target.value) || 0,
                    },
                  })
                }
                placeholder="25000"
                className="w-full pl-8 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none"
                style={{borderColor: '#da6927'}}
                min="0"
                max="100000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Maximum Commute Distance */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Maximum commute distance <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            type="range"
            min="1"
            max="50"
            value={data.maxCommuteDistance || 10}
            onChange={(e) =>
              onUpdate({ maxCommuteDistance: parseInt(e.target.value) })
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>1 mile</span>
            <span className="font-medium" style={{color: '#da6927'}}>
              {data.maxCommuteDistance || 10} miles
            </span>
            <span>50+ miles</span>
          </div>
        </div>
      </div>

      {/* Transport Modes */}
      <div>
        <label className="block text-sm font-medium text-black mb-4">
          How can you travel to work? <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TRANSPORT_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => toggleTransportMode(mode)}
              disabled={mode === "Car/Driving" && !data.hasDriversLicense}
              className={`p-3 rounded-lg border-2 transition-colors text-sm font-medium ${
                data.transportModes.includes(mode)
                  ? "bg-orange-50 text-black"
                  : mode === "Car/Driving" && !data.hasDriversLicense
                    ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
              }`}
              style={{
                ...(data.transportModes.includes(mode)
                  ? {borderColor: '#da6927', backgroundColor: '#fef3e2'}
                  : {})
              }}
            >
              {mode}
              {mode === "Car/Driving" && !data.hasDriversLicense && (
                <div className="text-xs text-gray-500 mt-1">
                  (Requires license)
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Select all that apply. This helps us show relevant jobs and travel
          information.
        </p>
      </div>

      {/* Availability Date */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          When are you available to start?{" "}
          <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={data.availabilityDate}
            onChange={(e) => onUpdate({ availabilityDate: e.target.value })}
            className="w-full pl-10 pr-4 py-4 bg-white border border-gray-300 rounded-lg text-black focus:outline-none"
            style={{
              borderColor: '#da6927',
              fontSize: '18px',
              minHeight: '56px',
              WebkitAppearance: 'none',
              MozAppearance: 'textfield'
            }}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <button
            onClick={handleComplete}
            disabled={
              isLoading ||
              data.interestedIndustries.length === 0 ||
              !data.availabilityDate ||
              !data.workType ||
              !data.salaryExpectation.min ||
              !data.salaryExpectation.max ||
              !data.maxCommuteDistance ||
              data.transportModes.length === 0
            }
            className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            style={{backgroundColor: '#da6927'}}
          >
            {isLoading ? "Creating Profile..." : "Complete Setup"}
          </button>
        </div>
        <button
          onClick={handleComplete}
          className="w-full bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Skip for now and explore jobs (you can complete this later)
        </button>
      </div>
    </div>
  );
}

export default function CandidateProfileSetup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    bio: "",
    dateOfBirth: "",
    phone: "",
    location: "",
    postcode: "",
    skills: [],
    hasDriversLicense: false,
    assistedNeeds: "",
    experiences: [],
    gcseGrades: [],
    interestedIndustries: [],
    availabilityDate: "",
    workType: "both",
    salaryExpectation: {
      min: 0,
      max: 0,
    },
    maxCommuteDistance: 10,
    transportModes: [],
  });

  const updateProfileData = (updates: Partial<ProfileData>) => {
    setProfileData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200" style={{backgroundColor: '#020202'}}>
        <button
          onClick={() => navigate("/candidate")}
          className="p-2 hover:bg-gray-700 rounded-full text-white"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Profile Setup</h1>
        <div className="w-10" />
      </header>

      {/* Progress Bar */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Step {currentStep} of 4</span>
          <span className="text-sm text-gray-600">
            {Math.round((currentStep / 4) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{ backgroundColor: '#da6927', width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto">
        {currentStep === 1 && (
          <ProfileSetupStep1
            data={profileData}
            onUpdate={updateProfileData}
            onNext={nextStep}
          />
        )}
        {currentStep === 2 && (
          <ProfileSetupStep2
            data={profileData}
            onUpdate={updateProfileData}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {currentStep === 3 && (
          <ProfileSetupStep3
            data={profileData}
            onUpdate={updateProfileData}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {currentStep === 4 && (
          <ProfileSetupStep4
            data={profileData}
            onUpdate={updateProfileData}
            onComplete={() => navigate("/candidate/home")}
            onBack={prevStep}
          />
        )}
      </div>
    </div>
  );
}
