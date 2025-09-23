import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CareerCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  sample_roles: string[];
  growth_rate: string;
  avg_salary: string;
  matchScore: number;
  matchPercentage: number;
}

interface CareerMatchResultsProps {
  matchResults: CareerCategory[];
  onContinue: () => void;
  onExploreJobs?: (categoryId: number) => void;
}

const CareerMatchResults: React.FC<CareerMatchResultsProps> = ({ 
  matchResults, 
  onContinue, 
  onExploreJobs 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CareerCategory | null>(null);

  const getMatchColor = (score: number) => {
    if (score >= 8.5) return 'from-green-500 to-emerald-600';
    if (score >= 7.0) return 'from-blue-500 to-blue-600';
    if (score >= 5.5) return 'from-yellow-500 to-orange-500';
    return 'from-gray-500 to-gray-600';
  };

  const getMatchLabel = (score: number) => {
    if (score >= 8.5) return 'Excellent Match';
    if (score >= 7.0) return 'Great Match';
    if (score >= 5.5) return 'Good Match';
    return 'Consider';
  };

  const CategoryCard: React.FC<{ category: CareerCategory; rank: number }> = ({ category, rank }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
      onClick={() => setSelectedCategory(category)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{category.icon}</span>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-600">#{rank} Match</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${getMatchColor(category.matchScore)}`}>
            {category.matchScore}/10
          </div>
          <p className="text-xs text-gray-500 mt-1">{getMatchLabel(category.matchScore)}</p>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4">{category.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {category.sample_roles.slice(0, 2).map((role, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-700">
              {role}
            </span>
          ))}
        </div>
        
        <div className="text-right">
          <p className="text-xs text-gray-500">Avg Salary</p>
          <p className="text-sm font-medium">{category.avg_salary}</p>
        </div>
      </div>

      <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${getMatchColor(category.matchScore)}`}
          initial={{ width: 0 }}
          animate={{ width: `${category.matchScore * 10}%` }}
          transition={{ delay: rank * 0.1 + 0.3, duration: 0.8 }}
        />
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Your Career Match Results
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Here are your top 5 career categories based on your personality
          </p>
          <p className="text-gray-500">
            Tap any category to explore specific roles and opportunities
          </p>
        </motion.div>

        {/* Career Match Cards */}
        <div className="space-y-6 mb-12">
          {matchResults.map((category, index) => (
            <CategoryCard key={category.id} category={category} rank={index + 1} />
          ))}
        </div>

        {/* Insights Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl p-8 shadow-lg mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            💡 What This Means For You
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Your Strengths</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Strong match with {matchResults[0]?.name}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Versatile across {matchResults.filter(c => c.matchScore >= 7).length} categories</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Growth potential in multiple sectors</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Next Steps</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Explore apprenticeships in your top categories</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>Watch career videos for specific roles</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  <span>Start applying to matched opportunities</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => onExploreJobs && onExploreJobs(matchResults[0]?.id)}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            🎯 See Matched Jobs
          </button>
          
          <button
            onClick={onContinue}
            className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all duration-200"
          >
            Complete Profile →
          </button>
        </div>
      </div>

      {/* Category Detail Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <CategoryDetailModal
            category={selectedCategory}
            onClose={() => setSelectedCategory(null)}
            onExploreJobs={onExploreJobs}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface CategoryDetailModalProps {
  category: CareerCategory;
  onClose: () => void;
  onExploreJobs?: (categoryId: number) => void;
}

const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({ category, onClose, onExploreJobs }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-4xl">{category.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
            <p className="text-purple-600 font-medium">{category.matchScore}/10 Match</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      <p className="text-gray-600 mb-6">{category.description}</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-lg text-gray-800 mb-3">Sample Roles</h3>
          <div className="space-y-2">
            {category.sample_roles.map((role, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span className="text-gray-700">{role}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg text-gray-800 mb-3">Key Info</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Average Salary</p>
              <p className="font-medium">{category.avg_salary}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Growth Rate</p>
              <p className="font-medium text-green-600">{category.growth_rate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Match Score</p>
              <div className="flex items-center space-x-2">
                <div className="bg-gray-200 rounded-full h-2 flex-1">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    style={{ width: `${category.matchScore * 10}%` }}
                  />
                </div>
                <span className="font-medium">{category.matchScore}/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button 
          onClick={() => onExploreJobs && onExploreJobs(category.id)}
          className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
        >
          View Jobs in {category.name}
        </button>
        <button 
          onClick={onClose}
          className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          Learn More
        </button>
      </div>

      {/* Success Message */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          ✨ This match is based on your personality and interests
        </p>
      </div>
    </motion.div>
  </motion.div>
);

export default CareerMatchResults;
