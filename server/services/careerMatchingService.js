const careerCategories = require('../data/careerCategories');

class CareerMatchingService {
  constructor() {
    // Personality traits with weights for matching
    this.personalityTraits = {
      // Work style preferences
      team_player: { weight: 0.8, categories: [2, 4, 8, 9, 12] },
      independent_worker: { weight: 0.8, categories: [1, 3, 16, 11] },
      leader: { weight: 0.9, categories: [4, 5, 17, 10] },
      
      // Interaction preferences  
      people_person: { weight: 0.9, categories: [2, 6, 8, 9, 14] },
      behind_scenes: { weight: 0.7, categories: [1, 3, 10, 13, 16] },
      
      // Work environment
      office_environment: { weight: 0.6, categories: [1, 4, 5, 10, 11] },
      hands_on_practical: { weight: 0.8, categories: [3, 7, 13, 15, 18] },
      creative_environment: { weight: 0.9, categories: [5, 12, 14] },
      
      // Skills and interests
      problem_solver: { weight: 0.9, categories: [1, 3, 16, 11] },
      helper: { weight: 0.8, categories: [2, 6, 9, 17] },
      creator: { weight: 0.9, categories: [5, 12, 14] },
      organizer: { weight: 0.7, categories: [4, 10, 13] },
      
      // Personality characteristics
      detail_oriented: { weight: 0.7, categories: [1, 3, 10, 11, 16] },
      big_picture_thinker: { weight: 0.7, categories: [4, 5, 12] },
      risk_taker: { weight: 0.6, categories: [5, 12, 17] },
      steady_reliable: { weight: 0.8, categories: [3, 4, 10, 13] },
      
      // Energy levels
      high_energy: { weight: 0.6, categories: [6, 8, 15, 17] },
      calm_focused: { weight: 0.6, categories: [1, 2, 11, 16] },
      
      // Learning style
      continuous_learner: { weight: 0.8, categories: [1, 2, 9, 16] },
      hands_on_learner: { weight: 0.8, categories: [3, 7, 15, 18] },
      
      // Career motivations
      money_motivated: { weight: 0.5, categories: [1, 5, 10, 11] },
      purpose_driven: { weight: 0.8, categories: [2, 9, 17, 18] },
      growth_focused: { weight: 0.7, categories: [1, 4, 5, 12] },
      stability_seeking: { weight: 0.7, categories: [3, 4, 10, 13] }
    };
  }

  // Main career matching function - returns scores 0-10 for each category
  calculateCareerMatch(candidateResponses) {
    const categoryScores = {};
    
    // Initialize all categories with base score
    Object.keys(careerCategories).forEach(categoryId => {
      categoryScores[categoryId] = 0;
    });
    
    // Calculate matches based on candidate responses
    Object.entries(candidateResponses).forEach(([questionId, response]) => {
      if (response && response.traits) {
        Object.entries(response.traits).forEach(([trait, score]) => {
          if (this.personalityTraits[trait]) {
            const traitConfig = this.personalityTraits[trait];
            const contributionScore = (score / 5) * traitConfig.weight; // Normalize to 0-1 range
            
            traitConfig.categories.forEach(categoryId => {
              categoryScores[categoryId] += contributionScore;
            });
          }
        });
      }
    });
    
    // Normalize scores to 0-10 scale and round to 1 decimal
    const maxPossibleScore = this.calculateMaxScore();
    Object.keys(categoryScores).forEach(categoryId => {
      const normalizedScore = (categoryScores[categoryId] / maxPossibleScore) * 10;
      categoryScores[categoryId] = Math.round(normalizedScore * 10) / 10;
      
      // Ensure minimum score of 1.0 and maximum of 10.0
      categoryScores[categoryId] = Math.max(1.0, Math.min(10.0, categoryScores[categoryId]));
    });
    
    return categoryScores;
  }

  // Get top 5 career categories for a candidate
  getTopCareerMatches(candidateResponses) {
    const scores = this.calculateCareerMatch(candidateResponses);
    
    const sortedMatches = Object.entries(scores)
      .map(([categoryId, score]) => ({
        ...careerCategories[categoryId],
        matchScore: score,
        matchPercentage: Math.round(score * 10) // Convert 0-10 to 0-100%
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
    
    return sortedMatches;
  }

  // Calculate the maximum possible score for normalization
  calculateMaxScore() {
    let maxScore = 0;
    Object.values(this.personalityTraits).forEach(trait => {
      maxScore += trait.weight;
    });
    return maxScore;
  }

  // Generate career insights for a specific match
  generateCareerInsights(categoryId, matchScore) {
    const category = careerCategories[categoryId];
    const insights = [];
    
    if (matchScore >= 8.5) {
      insights.push(`🎯 Excellent match! Your personality strongly aligns with ${category.name}.`);
      insights.push(`💪 You have the key traits needed to excel in this field.`);
    } else if (matchScore >= 7.0) {
      insights.push(`✅ Good match! You would likely enjoy working in ${category.name}.`);
      insights.push(`📈 This field offers good growth opportunities for your personality type.`);
    } else if (matchScore >= 5.5) {
      insights.push(`🤔 Moderate match. ${category.name} could work with the right role.`);
      insights.push(`💡 Consider exploring specific roles within this category.`);
    } else {
      insights.push(`⚠️ Lower match. ${category.name} might not align with your natural preferences.`);
      insights.push(`🎭 You might find this field challenging or less fulfilling.`);
    }
    
    return insights;
  }

  // Process quiz responses into trait scores
  processQuizResponses(responses) {
    const traitScores = {};
    
    Object.entries(responses).forEach(([questionId, response]) => {
      if (response && response.traits) {
        Object.entries(response.traits).forEach(([trait, score]) => {
          if (!traitScores[trait]) {
            traitScores[trait] = [];
          }
          traitScores[trait].push(score);
        });
      }
    });
    
    // Average the scores for each trait
    const averagedTraits = {};
    Object.entries(traitScores).forEach(([trait, scores]) => {
      averagedTraits[trait] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });
    
    return averagedTraits;
  }

  // Get all career categories for display
  getAllCategories() {
    return Object.values(careerCategories);
  }
}

module.exports = new CareerMatchingService();
