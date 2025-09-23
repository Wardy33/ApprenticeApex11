import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizOption {
  value: string;
  text: string;
  traits: Record<string, number>;
}

interface QuizQuestion {
  id: number;
  question: string;
  type: 'single_choice' | 'multi_select' | 'ranking';
  instruction?: string;
  max_selections?: number;
  options: QuizOption[];
}

interface QuizSection {
  name: string;
  questions: QuizQuestion[];
  icon: string;
}

interface CareerMatchQuizProps {
  onComplete: (data: { responses: Record<string, any>; timeTaken: number }) => void;
  onSkip?: () => void;
}

const CareerMatchQuiz: React.FC<CareerMatchQuizProps> = ({ onComplete, onSkip }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState(0);
  const [timeStarted] = useState(Date.now());
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Mock quiz data - in real app this would come from API
  const sections: QuizSection[] = [
    {
      name: 'Work Environment',
      icon: '🏢',
      questions: [
        {
          id: 1,
          question: "I prefer to work...",
          type: "single_choice",
          options: [
            { value: "team_player", text: "As part of a close-knit team", traits: { team_player: 5, people_person: 4 } },
            { value: "independent", text: "Independently with minimal supervision", traits: { independent_worker: 5, behind_scenes: 4 } },
            { value: "leadership", text: "Leading and guiding others", traits: { leader: 5, people_person: 3 } },
            { value: "support", text: "Supporting others to achieve their goals", traits: { helper: 5, team_player: 3 } }
          ]
        },
        {
          id: 2,
          question: "My ideal work environment is...",
          type: "single_choice",
          options: [
            { value: "office", text: "A modern office with the latest technology", traits: { office_environment: 5, detail_oriented: 3 } },
            { value: "outdoors", text: "Outdoors or in varied locations", traits: { hands_on_practical: 5, high_energy: 4 } },
            { value: "creative", text: "A creative studio or collaborative space", traits: { creative_environment: 5, creator: 4 } },
            { value: "helping", text: "Somewhere I can directly help people", traits: { helper: 5, people_person: 4 } }
          ]
        },
        {
          id: 3,
          question: "When working on projects, I tend to...",
          type: "single_choice",
          options: [
            { value: "details", text: "Focus on getting every detail perfect", traits: { detail_oriented: 5, steady_reliable: 4 } },
            { value: "big_picture", text: "Think about the big picture and overall impact", traits: { big_picture_thinker: 5, leader: 3 } },
            { value: "creative", text: "Come up with creative and innovative solutions", traits: { creator: 5, risk_taker: 3 } },
            { value: "practical", text: "Find the most practical and efficient approach", traits: { hands_on_practical: 5, organizer: 4 } }
          ]
        },
        {
          id: 4,
          question: "I feel most energized when...",
          type: "single_choice",
          options: [
            { value: "people", text: "Interacting and connecting with lots of people", traits: { people_person: 5, high_energy: 4 } },
            { value: "solving", text: "Solving complex problems or puzzles", traits: { problem_solver: 5, calm_focused: 3 } },
            { value: "creating", text: "Creating something new and original", traits: { creator: 5, big_picture_thinker: 3 } },
            { value: "helping", text: "Helping someone overcome a challenge", traits: { helper: 5, purpose_driven: 4 } }
          ]
        },
        {
          id: 5,
          question: "In group projects, I naturally...",
          type: "single_choice",
          options: [
            { value: "lead", text: "Take charge and organize everyone", traits: { leader: 5, organizer: 4 } },
            { value: "support", text: "Support others and keep things running smoothly", traits: { team_player: 5, steady_reliable: 4 } },
            { value: "ideas", text: "Generate creative ideas and solutions", traits: { creator: 5, big_picture_thinker: 4 } },
            { value: "quality", text: "Ensure quality and attention to detail", traits: { detail_oriented: 5, steady_reliable: 3 } }
          ]
        }
      ]
    },
    {
      name: 'Personality & Interests',
      icon: '🧠',
      questions: [
        {
          id: 6,
          question: "People would describe me as...",
          type: "multi_select",
          max_selections: 3,
          options: [
            { value: "outgoing", text: "Outgoing and sociable", traits: { people_person: 4, high_energy: 3 } },
            { value: "analytical", text: "Analytical and logical", traits: { problem_solver: 4, detail_oriented: 3 } },
            { value: "creative", text: "Creative and artistic", traits: { creator: 4, risk_taker: 2 } },
            { value: "reliable", text: "Reliable and dependable", traits: { steady_reliable: 4, organizer: 3 } },
            { value: "caring", text: "Caring and empathetic", traits: { helper: 4, purpose_driven: 3 } },
            { value: "ambitious", text: "Ambitious and driven", traits: { leader: 4, growth_focused: 3 } }
          ]
        },
        {
          id: 7,
          question: "In my free time, I enjoy...",
          type: "multi_select",
          max_selections: 3,
          options: [
            { value: "tech", text: "Technology, gaming, or coding", traits: { problem_solver: 3, continuous_learner: 3 } },
            { value: "sports", text: "Sports and physical activities", traits: { high_energy: 4, hands_on_practical: 2 } },
            { value: "art", text: "Art, music, or creative projects", traits: { creator: 4, creative_environment: 3 } },
            { value: "reading", text: "Reading and learning new things", traits: { continuous_learner: 4, calm_focused: 3 } },
            { value: "socializing", text: "Socializing and meeting people", traits: { people_person: 4, high_energy: 2 } },
            { value: "volunteering", text: "Volunteering and helping others", traits: { helper: 4, purpose_driven: 4 } }
          ]
        },
        {
          id: 8,
          question: "When learning something new, I prefer to...",
          type: "single_choice",
          options: [
            { value: "hands_on", text: "Learn by doing and practicing", traits: { hands_on_learner: 5, hands_on_practical: 3 } },
            { value: "theory", text: "Understand the theory first", traits: { continuous_learner: 5, detail_oriented: 3 } },
            { value: "visual", text: "See examples and visual demonstrations", traits: { creator: 3, big_picture_thinker: 3 } },
            { value: "discussion", text: "Discuss and learn from others", traits: { people_person: 4, team_player: 3 } }
          ]
        },
        {
          id: 9,
          question: "What motivates me most in work is...",
          type: "single_choice",
          options: [
            { value: "money", text: "Good salary and financial security", traits: { money_motivated: 4, stability_seeking: 3 } },
            { value: "purpose", text: "Making a positive difference", traits: { purpose_driven: 5, helper: 3 } },
            { value: "growth", text: "Learning and career progression", traits: { growth_focused: 5, continuous_learner: 3 } },
            { value: "recognition", text: "Recognition and achievement", traits: { leader: 3, growth_focused: 2 } }
          ]
        },
        {
          id: 10,
          question: "I handle stress best when I can...",
          type: "single_choice",
          options: [
            { value: "organize", text: "Create a plan and organize my approach", traits: { organizer: 4, steady_reliable: 3 } },
            { value: "talk", text: "Talk it through with others", traits: { people_person: 4, team_player: 3 } },
            { value: "focus", text: "Focus deeply on solving the problem", traits: { calm_focused: 4, problem_solver: 3 } },
            { value: "break", text: "Take a break and come back fresh", traits: { steady_reliable: 3, calm_focused: 3 } }
          ]
        }
      ]
    },
    {
      name: 'Career Preferences',
      icon: '🎯',
      questions: [
        {
          id: 11,
          question: "I would be excited to work in a job that involves...",
          type: "multi_select",
          max_selections: 4,
          options: [
            { value: "technology", text: "Working with technology and computers", traits: { problem_solver: 3, continuous_learner: 2 } },
            { value: "people_care", text: "Caring for and helping people", traits: { helper: 4, purpose_driven: 3 } },
            { value: "building", text: "Building or fixing things", traits: { hands_on_practical: 4, problem_solver: 2 } },
            { value: "business", text: "Business strategy and decision making", traits: { leader: 3, big_picture_thinker: 3 } },
            { value: "creative", text: "Creative design and artistic expression", traits: { creator: 4, creative_environment: 3 } },
            { value: "sales", text: "Selling products or services", traits: { people_person: 3, leader: 2 } },
            { value: "analysis", text: "Research and data analysis", traits: { problem_solver: 4, detail_oriented: 3 } },
            { value: "teaching", text: "Teaching and training others", traits: { helper: 3, people_person: 3 } }
          ]
        },
        {
          id: 12,
          question: "My ideal work schedule would be...",
          type: "single_choice",
          options: [
            { value: "nine_five", text: "Regular 9-5 Monday to Friday", traits: { stability_seeking: 4, steady_reliable: 3 } },
            { value: "flexible", text: "Flexible hours that I can control", traits: { independent_worker: 4, growth_focused: 2 } },
            { value: "varied", text: "Varied shifts including evenings/weekends", traits: { hands_on_practical: 2, high_energy: 3 } },
            { value: "project", text: "Project-based with intense periods", traits: { risk_taker: 3, big_picture_thinker: 2 } }
          ]
        },
        {
          id: 13,
          question: "In 5 years, I see myself...",
          type: "single_choice",
          options: [
            { value: "expert", text: "Being an expert specialist in my field", traits: { continuous_learner: 4, detail_oriented: 3 } },
            { value: "manager", text: "Managing a team or department", traits: { leader: 5, organizer: 3 } },
            { value: "entrepreneur", text: "Running my own business", traits: { risk_taker: 4, leader: 3 } },
            { value: "impact", text: "Making a significant positive impact", traits: { purpose_driven: 5, big_picture_thinker: 3 } }
          ]
        },
        {
          id: 14,
          question: "I would prefer a workplace that is...",
          type: "single_choice",
          options: [
            { value: "corporate", text: "Corporate and professional", traits: { stability_seeking: 3, money_motivated: 2 } },
            { value: "startup", text: "Young, dynamic startup environment", traits: { risk_taker: 4, high_energy: 3 } },
            { value: "nonprofit", text: "Mission-driven organization or charity", traits: { purpose_driven: 5, helper: 3 } },
            { value: "creative", text: "Creative and relaxed atmosphere", traits: { creator: 4, creative_environment: 4 } }
          ]
        },
        {
          id: 15,
          question: "When starting a new job, I would want...",
          type: "single_choice",
          options: [
            { value: "training", text: "Comprehensive training and support", traits: { continuous_learner: 3, steady_reliable: 2 } },
            { value: "mentorship", text: "A mentor to guide my development", traits: { growth_focused: 4, team_player: 2 } },
            { value: "independence", text: "Freedom to work independently", traits: { independent_worker: 4, risk_taker: 2 } },
            { value: "team", text: "A welcoming and supportive team", traits: { team_player: 4, people_person: 3 } }
          ]
        }
      ]
    }
  ];

  const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);

  useEffect(() => {
    const totalAnswered = Object.keys(responses).length;
    setProgress((totalAnswered / totalQuestions) * 100);
  }, [responses, totalQuestions]);

  const currentQuestionData = sections[currentSection]?.questions[currentQuestion];

  const handleResponse = (questionId: number, value: string | string[], traits: Record<string, number>) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { value, traits }
    }));
  };

  const nextQuestion = () => {
    setSelectedOptions([]);
    if (currentQuestion < sections[currentSection].questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
    } else {
      // Quiz complete
      const timeCompleted = Date.now();
      const timeTaken = Math.round((timeCompleted - timeStarted) / 1000 / 60 * 10) / 10; // minutes
      onComplete({ responses, timeTaken });
    }
  };

  const handleMultiSelect = (option: QuizOption) => {
    const maxSelections = currentQuestionData?.max_selections || 3;
    let newSelected = [...selectedOptions];
    
    if (newSelected.includes(option.value)) {
      newSelected = newSelected.filter(val => val !== option.value);
    } else if (newSelected.length < maxSelections) {
      newSelected.push(option.value);
    }
    
    setSelectedOptions(newSelected);
    
    // Combine traits from all selected options
    const combinedTraits: Record<string, number> = {};
    newSelected.forEach(selectedValue => {
      const selectedOption = currentQuestionData?.options.find(opt => opt.value === selectedValue);
      if (selectedOption) {
        Object.entries(selectedOption.traits).forEach(([trait, score]) => {
          combinedTraits[trait] = (combinedTraits[trait] || 0) + score;
        });
      }
    });
    
    handleResponse(currentQuestionData!.id, newSelected, combinedTraits);
  };

  const handleSingleChoice = (option: QuizOption) => {
    handleResponse(currentQuestionData!.id, option.value, option.traits);
    setTimeout(nextQuestion, 500);
  };

  if (!currentQuestionData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      {/* Skip Button */}
      {onSkip && (
        <div className="max-w-4xl mx-auto text-right mb-4">
          <button
            onClick={onSkip}
            className="text-gray-600 hover:text-gray-800 underline"
          >
            Skip Career Match
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white rounded-full p-2 shadow-sm">
          <div className="bg-gray-200 rounded-full h-3 relative overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Career Match Quiz</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
      </div>

      {/* Quiz Timer */}
      <div className="text-center mb-8">
        <p className="text-gray-600">
          ⏱️ Find your perfect career in under 5 minutes
        </p>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentSection}-${currentQuestion}`}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto"
        >
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-purple-600">
                {sections[currentSection].icon} {sections[currentSection].name}
              </span>
              <span className="text-sm text-gray-500">
                {currentQuestion + 1} of {sections[currentSection].questions.length}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentQuestionData.question}
            </h2>
            
            {currentQuestionData.instruction && (
              <p className="text-gray-600 text-sm">{currentQuestionData.instruction}</p>
            )}
          </div>

          <div className="space-y-3">
            {currentQuestionData.options.map((option, index) => (
              <motion.button
                key={option.value}
                onClick={() => {
                  if (currentQuestionData.type === 'multi_select') {
                    handleMultiSelect(option);
                  } else {
                    handleSingleChoice(option);
                  }
                }}
                className={`w-full p-4 text-left border-2 rounded-xl transition-all duration-200 group ${
                  currentQuestionData.type === 'multi_select' && selectedOptions.includes(option.value)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 group-hover:text-purple-700">
                    {option.text}
                  </span>
                  <span className="text-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Multi-select continue button */}
          {currentQuestionData.type === 'multi_select' && selectedOptions.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={nextQuestion}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Continue ({selectedOptions.length} selected)
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="max-w-2xl mx-auto mt-8 flex justify-between">
        <button
          onClick={() => {
            if (currentQuestion > 0) {
              setCurrentQuestion(currentQuestion - 1);
            } else if (currentSection > 0) {
              setCurrentSection(currentSection - 1);
              setCurrentQuestion(sections[currentSection - 1].questions.length - 1);
            }
          }}
          disabled={currentSection === 0 && currentQuestion === 0}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
        
        <span className="text-sm text-gray-500 self-center">
          {(currentSection * 5) + currentQuestion + 1} of {totalQuestions}
        </span>
      </div>
    </div>
  );
};

export default CareerMatchQuiz;
