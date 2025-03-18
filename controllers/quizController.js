const axios = require('axios');
const Quiz = require('../models/Quiz');
const mongoose = require('mongoose');

const generateQuiz = async (req, res) => {
    try {
        const { userId, topic, difficulty, questionsCount } = req.body;
        if (!userId || !topic || !difficulty || !questionsCount) {
            return res.status(400).json({ error: 'Missing required fields: userId, topic, difficulty, questionsCount' });
        }

        // Construct the prompt with dynamic values.
        const prompt = `Generate a multiple-choice quiz with ${questionsCount} questions about ${topic} at a ${difficulty} difficulty level. Provide the output strictly as a raw JSON array (do not wrap the output in markdown, code blocks, or any additional text). Each element in the array must be a JSON object with exactly these keys:
- "title": a string containing the question text,
- "options": an array of exactly four strings representing the answer options (labeled as "a) ...", "b) ...", "c) ...", "d) ..."),
- "correctAnswer": a string that exactly matches one of the options and indicates the correct answer.

Output only the raw JSON array.`;

        // Call the Gemini API with your API key.
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
        const geminiPayload = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        const geminiResponse = await axios.post(geminiUrl, geminiPayload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const candidate = geminiResponse.data.candidates && geminiResponse.data.candidates[0];
        if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0].text) {
            return res.status(500).json({ error: 'Invalid response from Gemini API' });
        }
        const quizText = candidate.content.parts[0].text;

        // Remove markdown code block markers if present.
        let jsonText = quizText.trim();
        if (jsonText.startsWith('```json')) {
            // Remove the starting ```json and ending ``` markers.
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }

        // Parse the JSON array from the cleaned text.
        let questions;
        try {
            questions = JSON.parse(jsonText);
        } catch (error) {
            console.error("Error parsing Gemini response as JSON:", error.message);
            return res.status(500).json({ error: 'Failed to parse Gemini response as JSON.' });
        }


        // Create the quiz document.
        const quiz = new Quiz({
            title: `${topic} ${difficulty} Quiz`,
            questions,
            score: 0,       // Default score value
            passed: false,  // Default passed value
            userId
        });

        // Save the quiz to the database.
        const savedQuiz = await quiz.save();
        res.status(201).json(savedQuiz);
    } catch (error) {
        console.error('Error generating quiz:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all quizzes for a specific user
const getUserQuizzes = async (req, res) => {
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

        // Get all quizzes for the user, sorted by creation date (newest first)
        const quizzes = await Quiz.find({ userId: userObjectId })
            .sort({ createdAt: -1 })
            .select('title score passed isAttempted createdAt')
            .lean();

        res.json({ success: true, data: quizzes });
    } catch (error) {
        console.error('Error fetching user quizzes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user quizzes'
        });
    }
};

// Get a single quiz by ID
const getQuizById = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }

        // Get and validate quiz ID
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid Quiz ID' });
        }

        // Convert string ID to ObjectId
        const quizObjectId = new mongoose.Types.ObjectId(id);

        // Get the quiz
        const quiz = await Quiz.findById(quizObjectId).lean();

        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        res.json({ success: true, data: quiz });
    } catch (error) {
        console.error('Error fetching quiz:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch quiz'
        });
    }
};

// Submit quiz answers and update quiz status
const submitQuizAnswers = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }

        // Get and validate quiz ID
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, error: 'Invalid Quiz ID' });
        }

        // Get and validate user ID
        const userId = req.headers['user-id'];
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, error: 'Invalid User ID' });
        }

        // Convert string IDs to ObjectIds
        const quizObjectId = new mongoose.Types.ObjectId(id);
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Get the quiz
        const quiz = await Quiz.findById(quizObjectId);

        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }

        // Verify that the quiz belongs to the user
        if (quiz.userId.toString() !== userObjectId.toString()) {
            return res.status(403).json({ success: false, error: 'Unauthorized access to this quiz' });
        }

        // Update the quiz with submitted answers
        const { questions, score, passed, isAttempted } = req.body;

        // Update quiz fields
        quiz.questions = questions;
        quiz.score = score;
        quiz.passed = passed;
        quiz.isAttempted = isAttempted;

        // Save the updated quiz
        await quiz.save();

        res.json({
            success: true,
            data: {
                _id: quiz._id,
                score: quiz.score,
                passed: quiz.passed
            }
        });
    } catch (error) {
        console.error('Error submitting quiz answers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit quiz answers'
        });
    }
};

module.exports = { generateQuiz, getUserQuizzes, getQuizById, submitQuizAnswers };
