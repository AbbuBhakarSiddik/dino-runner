import { Dino } from './Dino.js';
import { Obstacle } from './Obstacle.js';
import { Ground } from './Ground.js';
import { Cloud } from './Cloud.js';
import { ScoreManager } from './ScoreManager.js';

export class GameEngine {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Game objects
        this.dino = new Dino(canvas);
        this.ground = new Ground(canvas);
        this.clouds = [];
        this.obstacles = [];

        // Score manager
        this.scoreManager = new ScoreManager();

        // Game state
        this.gameState = 'waiting'; // waiting, playing, paused, over
        this.gameSpeed = 0;
        this.frameCount = 0;
        this.difficultyLevel = 1;

        // Callbacks
        this.onScoreUpdate = options.onScoreUpdate || (() => { });
        this.onGameOver = options.onGameOver || (() => { });
        this.onGameStart = options.onGameStart || (() => { });

        // Performance
        this.lastTime = 0;
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;
        this.frameTimer = 0;

        // Input handling
        this.keys = {};
        this.setupInputListeners();

        // Mobile support
        this.setupTouchListeners();

        // Initialize clouds
        this.initClouds();

        // Start game loop
        this.gameLoop = this.gameLoop.bind(this);
        this.animationId = null;
    }

    initClouds() {
        for (let i = 0; i < 5; i++) {
            const cloud = new Cloud(this.canvas);
            cloud.x = Math.random() * this.canvas.width;
            this.clouds.push(cloud);
        }
    }

    setupInputListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.handleJump();
            }

            if (e.code === 'ArrowDown') {
                e.preventDefault();
                this.dino.duck(true);
            }

            if (e.code === 'KeyP') {
                this.togglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;

            if (e.code === 'ArrowDown') {
                this.dino.duck(false);
            }
        });
    }

    setupTouchListeners() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleJump();
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.dino.duck(false);
        });
    }

    handleJump() {
        if (this.gameState === 'waiting') {
            this.startGame();
        } else if (this.gameState === 'playing') {
            this.dino.jump();
        } else if (this.gameState === 'over') {
            this.restartGame();
        }
    }

    startGame() {
        this.gameState = 'playing';
        this.gameSpeed = 0;
        this.frameCount = 0;
        this.difficultyLevel = 1;
        this.obstacles = [];
        this.scoreManager.reset();
        this.onGameStart();
    }

    restartGame() {
        this.dino.reset();
        this.obstacles = [];
        this.clouds = [];
        this.initClouds();
        this.startGame();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
    }

    gameLoop(timestamp) {
        this.animationId = requestAnimationFrame(this.gameLoop);

        // Calculate delta time for smooth animation
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Frame rate control
        if (this.frameTimer > this.frameInterval) {
            this.frameTimer = 0;

            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw background
            this.drawBackground();

            // Update and draw clouds (always animate, even when waiting)
            this.updateClouds();
            this.drawClouds();

            // Update and draw ground (always scroll when playing)
            if (this.gameState === 'playing') {
                this.update();
            }

            this.ground.draw();

            // Draw game objects
            this.drawObstacles();
            this.dino.draw();

            // Draw UI elements
            this.drawScore();
            this.drawGameState();

            this.frameCount++;
        } else {
            this.frameTimer += deltaTime;
        }
    }

    update() {
        // Increase difficulty over time
        if (this.frameCount % 300 === 0) { // Every 5 seconds at 60fps
            this.difficultyLevel++;
            this.gameSpeed = this.difficultyLevel * 0.5;
        }

        // Update game objects
        this.dino.update();
        this.ground.update(this.gameSpeed);

        // Update obstacles
        this.updateObstacles();

        // Update score
        this.scoreManager.update();
        this.onScoreUpdate(this.scoreManager.getScore());

        // Check collisions
        this.checkCollisions();

        // Spawn new obstacles
        this.spawnObstacles();
    }

    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].update(this.gameSpeed);

            // Remove obstacles that are off screen
            if (this.obstacles[i].isOffScreen()) {
                this.obstacles.splice(i, 1);
            }
        }
    }

    spawnObstacles() {
        // Random obstacle generation
        const spawnChance = 0.02 + (this.difficultyLevel * 0.002);
        const minDistance = 300 - (this.difficultyLevel * 10);

        if (Math.random() < spawnChance) {
            // Check if there's enough space since last obstacle
            const lastObstacle = this.obstacles[this.obstacles.length - 1];

            if (!lastObstacle || lastObstacle.x < this.canvas.width - minDistance) {
                // Randomly choose obstacle type
                const type = Math.random() < 0.7 ? 'cactus' : 'bird';
                this.obstacles.push(new Obstacle(this.canvas, type));
            }
        }
    }

    checkCollisions() {
        const dinoBounds = this.dino.getBounds();

        for (let obstacle of this.obstacles) {
            const obstacleBounds = obstacle.getBounds();

            // Simple AABB collision detection with padding
            const padding = 10;
            if (this.boxCollision(dinoBounds, obstacleBounds, padding)) {
                this.gameOver();
                return;
            }
        }
    }

    boxCollision(rect1, rect2, padding = 0) {
        return rect1.x + padding < rect2.x + rect2.width - padding &&
            rect1.x + rect1.width - padding > rect2.x + padding &&
            rect1.y + padding < rect2.y + rect2.height - padding &&
            rect1.y + rect1.height - padding > rect2.y + padding;
    }

    updateClouds() {
        for (let cloud of this.clouds) {
            cloud.update(this.gameSpeed);
            if (cloud.isOffScreen()) {
                cloud.reset();
            }
        }
    }

    drawBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#E0F0FF');
        gradient.addColorStop(1, '#F5F5F5');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Sun
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - 100, 80, 40, 0, Math.PI * 2);
        this.ctx.fill();

        // Sun rays
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x1 = this.canvas.width - 100 + Math.cos(angle) * 45;
            const y1 = 80 + Math.sin(angle) * 45;
            const x2 = this.canvas.width - 100 + Math.cos(angle) * 55;
            const y2 = 80 + Math.sin(angle) * 55;

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }

        // Far mountains
        this.ctx.fillStyle = '#95a5a6';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - 50);
        for (let x = 0; x <= this.canvas.width; x += 100) {
            const height = 60 + Math.sin(x * 0.01) * 30;
            this.ctx.lineTo(x, this.canvas.height - 50 - height);
        }
        this.ctx.lineTo(this.canvas.width, this.canvas.height - 50);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawClouds() {
        for (let cloud of this.clouds) {
            cloud.draw();
        }
    }

    drawObstacles() {
        for (let obstacle of this.obstacles) {
            obstacle.draw();
        }
    }

    drawScore() {
        this.ctx.save();
        this.ctx.font = 'bold 20px "Courier New", monospace';
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.textAlign = 'right';

        // Score text with shadow
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(
            `Score: ${Math.floor(this.scoreManager.getScore())}`,
            this.canvas.width - 20,
            40
        );

        // High score
        this.ctx.font = '14px "Courier New", monospace';
        this.ctx.fillText(
            `HI: ${Math.floor(this.scoreManager.getHighScore())}`,
            this.canvas.width - 20,
            65
        );

        if (this.gameState === 'playing') {
            this.ctx.font = '12px "Courier New", monospace';
            this.ctx.fillText(
                `Speed: ${Math.floor(this.gameSpeed * 10) + 10} km/h`,
                this.canvas.width - 20,
                85
            );
        }

        this.ctx.restore();
    }

    drawGameState() {
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#2c3e50';

        if (this.gameState === 'waiting') {
            this.drawStartScreen();
        } else if (this.gameState === 'paused') {
            this.drawPauseScreen();
        } else if (this.gameState === 'over') {
            this.drawGameOverScreen();
        }

        this.ctx.restore();
    }

    drawStartScreen() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Title
        this.ctx.font = 'bold 48px "Courier New", monospace';
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillText('🦕 DINO RUNNER 🦕', centerX, centerY - 60);

        // Instructions
        this.ctx.font = '20px "Courier New", monospace';
        this.ctx.fillStyle = '#7f8c8d';

        const instructions = [
            'Press SPACE or ↑ to Start',
            '↑ to Jump | ↓ to Duck',
            'P to Pause',
            'Avoid the obstacles!'
        ];

        instructions.forEach((text, index) => {
            this.ctx.fillText(text, centerX, centerY + (index * 30));
        });

        // Blinking text
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            this.ctx.font = 'bold 16px "Courier New", monospace';
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.fillText('PRESS ANY KEY TO START', centerX, centerY + 130);
        }
    }

    drawPauseScreen() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Pause text
        this.ctx.font = 'bold 48px "Courier New", monospace';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('⏸️ PAUSED ⏸️', centerX, centerY);

        this.ctx.font = '20px "Courier New", monospace';
        this.ctx.fillText('Press P to Resume', centerX, centerY + 40);
    }

    drawGameOverScreen() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Game Over text
        this.ctx.font = 'bold 48px "Courier New", monospace';
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillText('GAME OVER 💀', centerX, centerY - 40);

        // Final score
        this.ctx.font = 'bold 24px "Courier New", monospace';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(
            `Score: ${Math.floor(this.scoreManager.getScore())}`,
            centerX,
            centerY + 20
        );

        // High score
        this.ctx.fillText(
            `Best: ${Math.floor(this.scoreManager.getHighScore())}`,
            centerX,
            centerY + 50
        );

        // Restart instruction
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            this.ctx.font = 'bold 18px "Courier New", monospace';
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.fillText('PRESS SPACE TO RESTART 🦕', centerX, centerY + 90);
        }
    }

    gameOver() {
        this.gameState = 'over';
        this.scoreManager.saveHighScore();
        this.onGameOver({
            score: this.scoreManager.getScore(),
            highScore: this.scoreManager.getHighScore(),
            survivalTime: this.scoreManager.getSurvivalTime(),
            distance: this.scoreManager.getDistance()
        });
    }

    getScore() {
        return this.scoreManager.getScore();
    }

    start() {
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame(this.gameLoop);
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener('keydown', this.setupInputListeners);
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.dino.canvas.height = height;
        this.ground.canvas.height = height;
        this.ground.y = height - 50;

        if (this.dino.y > height - 100) {
            this.dino.y = height - 100;
        }
    }
}