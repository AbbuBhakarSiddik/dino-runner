const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dino-runner-secret-key-2024';

// Helper to read local users
function getLocalUsers(req) {
    const filePath = path.join(req.app.locals.dataDir, 'users.json');
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

// Helper to save local users
function saveLocalUsers(req, users) {
    const filePath = path.join(req.app.locals.dataDir, 'users.json');
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf8');
}

// Generate JWT token
function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, bio } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide username, email, and password' });
        }

        // Use local storage fallback
        if (req.app.locals.useLocalStorage) {
            const users = getLocalUsers(req);

            if (users.find(u => u.email === email || u.username === username)) {
                return res.status(400).json({ message: 'User with this email or username already exists' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = {
                id: Date.now().toString(),
                username,
                email,
                password: hashedPassword,
                bio: bio || '',
                avatar: '🦕',
                highScore: 0,
                totalGamesPlayed: 0,
                bestSurvivalTime: 0,
                totalDistance: 0,
                isGuest: false,
                createdAt: new Date().toISOString(),
                achievements: []
            };

            users.push(newUser);
            saveLocalUsers(req, users);

            const token = generateToken(newUser.id);

            return res.status(201).json({
                message: '🦕 Registration successful (Local)!',
                token,
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    bio: newUser.bio,
                    highScore: newUser.highScore
                }
            });
        }

        // MongoDB Logic
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email or username already exists' });
        }

        const user = new User({
            username,
            email,
            password,
            bio: bio || ''
        });

        await user.save();
        const token = generateToken(user._id);

        res.status(201).json({
            message: '🦕 Registration successful! Welcome to the herd!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar,
                highScore: user.highScore
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if ((!username && !email) || !password) {
            return res.status(400).json({ message: 'Please provide username/email and password' });
        }

        // Use local storage fallback
        if (req.app.locals.useLocalStorage) {
            const users = getLocalUsers(req);

            const user = users.find(u => u.username === username || u.email === email);
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const token = generateToken(user.id);

            return res.json({
                message: `🦖 Welcome back, ${user.username}!`,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    bio: user.bio,
                    highScore: user.highScore
                }
            });
        }

        // MongoDB Logic
        const user = await User.findOne({ $or: [{ username: username || '' }, { email: email || '' }] });
        if (!user) {
            return res.status(401).json({ message: '🦴 No dinosaur found with these credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: '🦴 Wrong password! Try again.' });
        }

        const token = generateToken(user._id);

        res.json({
            message: `🦖 Welcome back, ${user.username}!`,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar,
                highScore: user.highScore
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
});

// POST /api/auth/guest
router.post('/guest', async (req, res) => {
    try {
        const guestName = `Dino${Math.floor(Math.random() * 9999)}`;
        const token = generateToken('guest-' + Date.now());

        res.json({
            message: '🎮 Playing as guest!',
            token,
            user: {
                id: 'guest',
                username: guestName,
                isGuest: true
            }
        });
    } catch (error) {
        console.error('Guest login error:', error);
        res.status(500).json({ message: 'Guest login failed' });
    }
});

module.exports = router;


module.exports = router;