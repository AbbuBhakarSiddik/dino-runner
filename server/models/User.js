const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [20, 'Username cannot exceed 20 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    bio: {
        type: String,
        default: '',
        maxlength: [200, 'Bio cannot exceed 200 characters']
    },
    avatar: {
        type: String,
        default: '🦕'
    },
    highScore: {
        type: Number,
        default: 0
    },
    totalGamesPlayed: {
        type: Number,
        default: 0
    },
    bestSurvivalTime: {
        type: Number,
        default: 0
    },
    totalDistance: {
        type: Number,
        default: 0
    },
    isGuest: {
        type: Boolean,
        default: false
    },
    lastPlayed: {
        type: Date,
        default: Date.now
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    achievements: [{
        name: String,
        unlockedAt: Date,
        icon: String
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Update game stats
userSchema.methods.updateGameStats = async function (score, survivalTime, distance) {
    if (score > this.highScore) {
        this.highScore = score;
    }
    if (survivalTime > this.bestSurvivalTime) {
        this.bestSurvivalTime = survivalTime;
    }
    this.totalGamesPlayed += 1;
    this.totalDistance += distance;
    this.lastPlayed = new Date();

    // Check achievements
    if (score >= 100 && !this.achievements.find(a => a.name === 'Century')) {
        this.achievements.push({
            name: 'Century',
            unlockedAt: new Date(),
            icon: '⭐'
        });
    }
    if (survivalTime >= 60 && !this.achievements.find(a => a.name === 'Marathon')) {
        this.achievements.push({
            name: 'Marathon',
            unlockedAt: new Date(),
            icon: '🌟'
        });
    }

    return this.save();
};

// Remove password from JSON response
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);