const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Score = require('../models/Score');
const { optionalAuth } = require('../middleware/auth');

// Helper functions for local storage
function getLocalScores(req) {
    const filePath = path.join(req.app.locals.dataDir, 'scores.json');
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

function saveLocalScores(req, scores) {
    const filePath = path.join(req.app.locals.dataDir, 'scores.json');
    fs.writeFileSync(filePath, JSON.stringify(scores, null, 2), 'utf8');
}

// GET /api/leaderboard
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { type = 'all', limit = 100 } = req.query;

        // Use local storage fallback
        if (req.app.locals.useLocalStorage) {
            let scores = getLocalScores(req);

            if (type === 'daily') {
                const today = new Date().setHours(0, 0, 0, 0);
                scores = scores.filter(s => new Date(s.date).getTime() >= today);
            } else if (type === 'weekly') {
                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                scores = scores.filter(s => new Date(s.date).getTime() >= weekAgo);
            }

            scores.sort((a, b) => b.score - a.score);
            scores = scores.slice(0, parseInt(limit));

            const rankedScores = scores.map((score, index) => ({
                ...score,
                rank: index + 1,
                isCurrentUser: req.userId ? score.userId === req.userId : false
            }));

            return res.json(rankedScores);
        }

        // MongoDB Logic
        const leaderboard = await Score.getLeaderboard(type, parseInt(limit));
        const rankedLeaderboard = leaderboard.map((score, index) => ({
            ...score.toObject(),
            rank: index + 1,
            isCurrentUser: req.userId ? score.userId?.toString() === req.userId : false
        }));

        res.json(rankedLeaderboard);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.json([]);
    }
});

// POST /api/leaderboard
router.post('/', optionalAuth, async (req, res) => {
    try {
        const { username, score, survivalTime, distance } = req.body;

        if (!username || score === undefined) {
            return res.status(400).json({ message: 'Username and score are required' });
        }

        // Use local storage fallback
        if (req.app.locals.useLocalStorage) {
            const scores = getLocalScores(req);

            const newScore = {
                id: Date.now().toString(),
                userId: req.userId || null,
                username: username.trim(),
                score: Math.floor(score),
                survivalTime: survivalTime || 0,
                distance: distance || 0,
                date: new Date().toISOString(),
                device: req.headers['user-agent'] || 'Unknown',
                isGuest: !req.userId
            };

            scores.push(newScore);
            saveLocalScores(req, scores);

            const betterScores = scores.filter(s => s.score > newScore.score).length;
            const rank = betterScores + 1;

            return res.status(201).json({
                message: '🏆 Score saved (Local)!',
                score: newScore,
                rank,
                isTop10: rank <= 10
            });
        }

        // MongoDB Logic
        const scoreRecord = new Score({
            userId: req.userId || null,
            username: username.trim(),
            score: Math.floor(score),
            survivalTime: survivalTime || 0,
            distance: distance || 0,
            device: req.headers['user-agent'] || 'Unknown',
            isGuest: !req.userId
        });

        await scoreRecord.save();

        const betterScores = await Score.countDocuments({ score: { $gt: scoreRecord.score } });
        const rank = betterScores + 1;

        res.status(201).json({
            message: '🏆 Score saved!',
            score: scoreRecord,
            rank: rank,
            isTop10: rank <= 10
        });
    } catch (error) {
        console.error('Submit score error:', error);
        res.status(500).json({ message: 'Failed to save score' });
    }
});

// GET /api/leaderboard/user/:username
router.get('/user/:username', async (req, res) => {
    try {
        const { username } = req.params;

        // Use local storage fallback
        if (req.app.locals.useLocalStorage) {
            const scores = getLocalScores(req);
            const userScores = scores
                .filter(s => s.username === username)
                .sort((a, b) => b.score - a.score)
                .slice(0, 50);

            const stats = {
                totalGames: userScores.length,
                bestScore: userScores.length > 0 ? userScores[0].score : 0,
                avgScore: userScores.length > 0 ?
                    Math.floor(userScores.reduce((sum, s) => sum + s.score, 0) / userScores.length) : 0,
                bestTime: userScores.length > 0 ?
                    Math.max(...userScores.map(s => s.survivalTime || 0)) : 0,
                totalDistance: userScores.reduce((sum, s) => sum + (s.distance || 0), 0)
            };

            const allScores = scores.sort((a, b) => b.score - a.score);
            const rank = allScores.findIndex(s => s.username === username && s.score === stats.bestScore) + 1;

            return res.json({
                scores: userScores,
                stats,
                rank: rank || 'Unranked',
                bestScore: userScores[0] || null
            });
        }

        // MongoDB Logic
        const userScores = await Score.find({ username })
            .sort({ score: -1 })
            .limit(50);

        const stats = await Score.getUserStats(username);
        const bestScore = await Score.getUserBest(username);
        const rank = bestScore ?
            await Score.countDocuments({ score: { $gt: bestScore.score } }) + 1 :
            null;

        res.json({
            scores: userScores,
            stats: stats || {
                totalGames: 0,
                bestScore: 0,
                avgScore: 0,
                bestTime: 0,
                totalDistance: 0
            },
            rank: rank || 'Unranked',
            bestScore: bestScore || null
        });
    } catch (error) {
        console.error('User scores error:', error);
        res.json({ scores: [], stats: null, rank: 'Unranked' });
    }
});

module.exports = router;