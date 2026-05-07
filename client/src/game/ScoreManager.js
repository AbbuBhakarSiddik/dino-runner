export class ScoreManager {
    constructor() {
        this.score = 0;
        this.highScore = 0;
        this.startTime = 0;
        this.distance = 0;
        this.scorePerSecond = 10;
        this.distanceMultiplier = 1;

        // Load high score from storage
        this.loadHighScore();
    }

    reset() {
        this.score = 0;
        this.startTime = Date.now();
        this.distance = 0;
        this.distanceMultiplier = 1;
    }

    update() {
        if (this.startTime === 0) {
            this.startTime = Date.now();
        }

        // Calculate survival time in seconds
        const survivalTime = this.getSurvivalTime();

        // Score increases over time
        this.score = survivalTime * this.scorePerSecond;

        // Distance increases with speed
        this.distance += 0.1 * this.distanceMultiplier;

        // Bonus for distance milestones
        const distanceBonus = Math.floor(this.distance / 100) * 50;
        this.score += distanceBonus;

        // Increase multiplier every 30 seconds
        this.distanceMultiplier = 1 + Math.floor(survivalTime / 30) * 0.5;
    }

    getScore() {
        return this.score;
    }

    getSurvivalTime() {
        if (this.startTime === 0) return 0;
        return (Date.now() - this.startTime) / 1000;
    }

    getDistance() {
        return this.distance;
    }

    getHighScore() {
        return this.highScore;
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('dinoHighScore', Math.floor(this.highScore));
        }
    }

    loadHighScore() {
        const stored = localStorage.getItem('dinoHighScore');
        if (stored) {
            this.highScore = parseInt(stored);
        }
    }

    getStats() {
        return {
            score: Math.floor(this.score),
            highScore: Math.floor(this.highScore),
            survivalTime: this.getSurvivalTime(),
            distance: Math.floor(this.distance),
            multiplier: this.distanceMultiplier.toFixed(1)
        };
    }
}