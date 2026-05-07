const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Score = require('../models/Score');
const { verifyToken } = require('../middleware/auth');

// Helper functions for local storage
function getLocalUsers(req) {
    const filePath = path.join(req.app.locals.dataDir, 'users.json');
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

function saveLocalUsers(req, users) {
    const filePath = path.join(req.app.locals.dataDir, 'users.json');
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf8');
}

function getLocalScores(req) {
    const filePath = path.join(req.app.locals.dataDir, 'scores.json');
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

// GET /api/users/profile/:username
router.get('/profile/:username', async (req, res) => {
    try {
        const { username } = req.params;

        // Use local storage fallback
        if (req.app.locals.useLocalStorage) {
            const users = getLocalUsers(req);
            const user = users.find(u => u.username === username);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const scores = getLocalScores(req).filter(s => s.username === username);
            const recentScores = scores.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

            return res.json({
                user: { ...user, password: obscurePassword(user.password) },
                stats: {
                    totalGames: user.totalGamesPlayed,
                    bestScore: user.highScore,
                    bestTime: user.bestSurvivalTime,
                    totalDistance: user.totalDistance
                },
                recentScores
            });
        }

        // MongoDB Logic
        const user = await User.findOne({ username }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const stats = await Score.getUserStats(username);
        const recentScores = await Score.find({ username })
            .sort({ date: -1 })
            .limit(10);

        res.json({
            user,
            stats: stats || {
                totalGames: user.totalGamesPlayed,
                bestScore: user.highScore,
                bestTime: user.bestSurvivalTime,
                totalDistance: user.totalDistance
            },
            recentScores
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Failed to get profile' });
    }
});

// Helper to obscure password in response if using local
function obscurePassword(pwd) { return '********'; }

// PATCH /api/users/update
router.patch('/update', verifyToken, async (req, res) => {
    try {
        const { bio, avatar, username } = req.body;

        // Use local storage fallback
        if (req.app.locals.useLocalStorage) {
            const users = getLocalUsers(req);
            const userIndex = users.findIndex(u => u.id === req.userId);

            if (userIndex === -1) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (username && username !== users[userIndex].username) {
                if (users.find(u => u.username === username)) {
                    return res.status(400).json({ message: 'Username is already taken' });
                }
                users[userIndex].username = username;
            }

            if (bio !== undefined) users[userIndex].bio = bio;
            if (avatar !== undefined) users[userIndex].avatar = avatar;

            saveLocalUsers(req, users);
            return res.json({ message: '✅ Profile updated!', user: users[userIndex] });
        }

        // MongoDB Logic
        const updates = {};
        if (bio !== undefined) updates.bio = bio;
        if (avatar !== undefined) updates.avatar = avatar;

        if (username) {
            const existingUser = await User.findOne({ username, _id: { $ne: req.userId } });
            if (existingUser) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
            updates.username = username;
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({ message: '✅ Profile updated!', user });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
});

// GET /api/users/stats/:username
router.get('/stats/:username', async (req, res) => {
    try {
        const { username } = req.params;

        // Use local storage fallback
        if (req.app.locals.useLocalStorage) {
            const scores = getLocalScores(req).filter(s => s.username === username);
            if (scores.length === 0) {
                return res.json({ totalGames: 0, bestScore: 0, avgScore: 0, bestTime: 0, totalDistance: 0, gamesToday: 0 });
            }

            const today = new Date().setHours(0, 0, 0, 0);
            const stats = {
                totalGames: scores.length,
                bestScore: Math.max(...scores.map(s => s.score)),
                avgScore: Math.floor(scores.reduce((sum, s) => sum + s.score, 0) / scores.length),
                bestTime: Math.max(...scores.map(s => s.survivalTime || 0)),
                totalDistance: scores.reduce((sum, s) => sum + (s.distance || 0), 0),
                gamesToday: scores.filter(s => new Date(s.date).getTime() >= today).length
            };

            return res.json(stats);
        }

        // MongoDB Logic
        const stats = await Score.aggregate([
            { $match: { username } },
            {
                $group: {
                    _id: null,
                    totalGames: { $sum: 1 },
                    bestScore: { $max: '$score' },
                    avgScore: { $avg: '$score' },
                    bestTime: { $max: '$survivalTime' },
                    totalDistance: { $sum: '$distance' },
                    lastPlayed: { $max: '$date' },
                    gamesToday: {
                        $sum: {
                            $cond: [{ $gte: ['$date', new Date(new Date().setHours(0, 0, 0, 0))] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        res.json(stats[0] || { totalGames: 0, bestScore: 0, avgScore: 0, bestTime: 0, totalDistance: 0, gamesToday: 0 });
    } catch (error) {
        console.error('Get stats error:', error);
        res.json({ totalGames: 0, bestScore: 0, avgScore: 0, bestTime: 0, totalDistance: 0, gamesToday: 0 });
    }
});

// POST /api/users/sync-scores
router.post('/sync-scores', verifyToken, async (req, res) => {
    try {
        const { scores } = req.body;
        if (!scores || !Array.isArray(scores)) {
            return res.status(400).json({ message: 'Scores array is required' });
        }

        // This is primarily for MongoDB sync
        if (req.app.locals.useLocalStorage) {
            return res.json({ message: '✅ Scores already in local storage', syncedCount: scores.length });
        }

        const savedScores = [];
        for (const scoreData of scores) {
            const score = new Score({
                userId: req.userId,
                username: scoreData.username,
                score: Math.floor(scoreData.score),
                survivalTime: scoreData.survivalTime || 0,
                distance: scoreData.distance || 0,
                date: scoreData.timestamp || new Date()
            });
            await score.save();
            savedScores.push(score);
        }

        const user = await User.findById(req.userId);
        if (user) {
            user.highScore = Math.max(...scores.map(s => s.score), user.highScore);
            user.bestSurvivalTime = Math.max(...scores.map(s => s.survivalTime || 0), user.bestSurvivalTime);
            user.totalGamesPlayed += scores.length;
            user.totalDistance += scores.reduce((sum, s) => sum + (s.distance || 0), 0);
            await user.save();
        }

        res.json({ message: `✅ Synced ${savedScores.length} scores!`, syncedCount: savedScores.length });
    } catch (error) {
        console.error('Sync scores error:', error);
        res.status(500).json({ message: 'Failed to sync scores' });
    }
});

module.exports = router;