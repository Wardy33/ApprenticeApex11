const express = require('express');
const router = express.Router();
const careerMatchingService = require('../services/careerMatchingService');
const careerCategories = require('../data/careerCategories');
const careerMatchQuestions = require('../data/careerMatchQuestions');
const authenticateToken = require('../middleware/auth');

// Get career match questions
router.get('/questions', async (req, res) => {
  try {
    res.json({
      success: true,
      questions: careerMatchQuestions,
      totalQuestions: Object.values(careerMatchQuestions).flat().length,
      estimatedTime: '5 minutes'
    });
  } catch (error) {
    console.error('Error fetching career match questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Submit career match responses
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { responses, timeTaken } = req.body;
    const candidateId = req.user.userId;

    // Process responses into career matches
    const topMatches = careerMatchingService.getTopCareerMatches(responses);
    
    // Generate insights for top match
    const insights = careerMatchingService.generateCareerInsights(
      topMatches[0].id, 
      topMatches[0].matchScore
    );

    // Save career match results to database
    const careerMatchData = {
      candidateId,
      completedAt: new Date(),
      topCategories: topMatches,
      timeTaken,
      insights,
      responses: JSON.stringify(responses)
    };

    // TODO: Save to database when implemented
    // await CareerMatch.create(careerMatchData);

    res.json({
      success: true,
      matches: topMatches,
      insights,
      timeTaken,
      message: 'Career match completed successfully!'
    });

  } catch (error) {
    console.error('Error processing career match:', error);
    res.status(500).json({ error: 'Failed to process career match' });
  }
});

// Get career match results for a user
router.get('/results/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user can access these results
    if (req.user.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // TODO: Fetch from database when implemented
    // const careerMatch = await CareerMatch.findOne({ candidateId: userId });
    
    // For now, return mock data
    res.json({
      success: true,
      hasCompleted: false,
      matches: [],
      message: 'No career match completed yet'
    });

  } catch (error) {
    console.error('Error fetching career match results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Get all career categories
router.get('/categories', async (req, res) => {
  try {
    const categories = careerMatchingService.getAllCategories();
    
    res.json({
      success: true,
      categories,
      totalCategories: categories.length
    });
  } catch (error) {
    console.error('Error fetching career categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get specific career category details
router.get('/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = careerCategories[categoryId];
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Error fetching career category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Calculate match score for specific responses (utility endpoint)
router.post('/calculate', async (req, res) => {
  try {
    const { responses } = req.body;
    
    if (!responses) {
      return res.status(400).json({ error: 'Responses required' });
    }

    const scores = careerMatchingService.calculateCareerMatch(responses);
    const topMatches = careerMatchingService.getTopCareerMatches(responses);
    
    res.json({
      success: true,
      scores,
      topMatches
    });
  } catch (error) {
    console.error('Error calculating career match:', error);
    res.status(500).json({ error: 'Failed to calculate match' });
  }
});

// Get career insights for a specific category and score
router.get('/insights/:categoryId/:score', async (req, res) => {
  try {
    const { categoryId, score } = req.params;
    const matchScore = parseFloat(score);
    
    if (isNaN(matchScore) || matchScore < 0 || matchScore > 10) {
      return res.status(400).json({ error: 'Invalid score. Must be between 0 and 10.' });
    }

    const insights = careerMatchingService.generateCareerInsights(
      parseInt(categoryId), 
      matchScore
    );
    
    res.json({
      success: true,
      insights,
      category: careerCategories[categoryId]
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

module.exports = router;
