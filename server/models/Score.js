const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow guest scores
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true
    },
    score: {
        type: Number,
        required: [true, 'Score is required'],
        min: [0, 'Score cannot be negative']
    },
    survivalTime: {
        type: Number,
        default: 0,
        min: 0
    },
    distance: {
        type: Number,
        default: 0,
        min: 0
    },
    device: {
        type: String,
        default: 'Unknown'
    },
    platform: {
        type: String,
        default: 'Web'
    },
    isGuest: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster leaderboard queries
scoreSchema.index({ score: -1 });
scoreSchema.index({ date: -1 });
scoreSchema.index({ username: 1, score: -1 });

// Static method to get leaderboard
scoreSchema.statics.getLeaderboard = async function (type = 'all', limit = 100) {
    let query = {};

    const now = new Date();
    switch (type) {
        case 'daily':
            query.date = {
                $gte: new Date(now.setHours(0, 0, 0, 0))
            };
            break;
        case 'weekly':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            query.date = { $gte: weekAgo };
            break;
        case 'monthly':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            query.date = { $gte: monthAgo };
            break;
    }

    return this.find(query)
        .sort({ score: -1 })
        .limit(limit)
        .select('-__v');
};

// Static method to get user's best score
scoreSchema.statics.getUserBest = async function (username) {
    return this.findOne({ username })
        .sort({ score: -1 })
        .limit(1);
};

// Static method to get user stats
scoreSchema.statics.getUserStats = async function (username) {
    const stats = await this.aggregate([
        { $match: { username } },
        {
            $group: {
                _id: null,
                totalGames: { $sum: 1 },
                bestScore: { $max: '$score' },
                avgScore: { $avg: '$score' },
                bestTime: { $max: '$survivalTime' },
                totalDistance: { $sum: '$distance' },
                lastPlayed: { $max: '$date' }
            }
        }
    ]);

    return stats[0] || null;
};

module.exports = mongoose.model('Score', scoreSchema);