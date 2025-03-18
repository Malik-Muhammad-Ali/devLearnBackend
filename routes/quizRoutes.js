const express = require('express');
const router = express.Router();
const { generateQuiz, getUserQuizzes, getQuizById, submitQuizAnswers } = require('../controllers/quizController');

// POST /api/quiz to generate and store a new quiz
router.post('/', generateQuiz);

// GET /api/quiz/user to get all quizzes for a user
router.get('/user', getUserQuizzes);

// GET /api/quiz/:id to get a single quiz by ID
router.get('/:id', getQuizById);

// PUT /api/quiz/:id/submit to submit quiz answers
router.put('/:id/submit', submitQuizAnswers);

module.exports = router;
