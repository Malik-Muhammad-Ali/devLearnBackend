const Quiz = require('../models/Quiz');
const mongoose = require('mongoose');

const getDashboardStats = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    // Get and validate user ID
    const userId = req.headers['user-id'];
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid User ID' });
    }

    // Convert string ID to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get basic quiz statistics
    const totalQuizzes = await Quiz.countDocuments({ userId: userObjectId });
    const passedQuizzes = await Quiz.countDocuments({ userId: userObjectId, passed: true });
    const failedQuizzes = await Quiz.countDocuments({ userId: userObjectId, passed: false });

    // Calculate average score
    const scoreStats = await Quiz.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$score' },
          bestScore: { $max: '$score' }
        }
      }
    ]);

    // Calculate highest streak (consecutive passed quizzes)
    const quizzes = await Quiz.find({ userId: userObjectId })
      .sort({ createdAt: 1 })
      .select('passed')
      .lean();

    let currentStreak = 0;
    let highestStreak = 0;
    
    quizzes.forEach(quiz => {
      if (quiz.passed) {
        currentStreak++;
        highestStreak = Math.max(highestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    // Get performance trend data (last 12 quizzes)
    const recentPerformance = await Quiz.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(12)
      .select('score createdAt')
      .lean();

    const stats = {
      totalQuizzes,
      passedQuizzes,
      failedQuizzes,
      averageScore: scoreStats[0]?.averageScore.toFixed(1) || 0,
      highestStreak,
      bestScore: scoreStats[0]?.bestScore || 0,
      performanceTrend: recentPerformance.reverse().map(quiz => ({
        score: quiz.score,
        date: quiz.createdAt
      }))
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard statistics' 
    });
  }
};

module.exports = {
  getDashboardStats
};
