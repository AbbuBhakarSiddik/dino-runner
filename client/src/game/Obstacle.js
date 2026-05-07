export class Obstacle {
    constructor(canvas, type = 'cactus') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.type = type;

        // Obstacle properties
        this.width = type === 'cactus' ? 25 : 40;
        this.height = type === 'cactus' ? 50 : 35;
        this.x = canvas.width;
        this.y = canvas.height - 100;

        // Speed (increases over time)
        this.speed = 8;

        // For bird obstacles
        this.birdWingFrame = 0;
        this.birdWingTimer = 0;
        this.birdY = canvas.height - 140;

        // Colors
        this.color = type === 'cactus' ? '#27ae60' : '#e74c3c';
    }

    update(speedIncrease = 0) {
        this.speed = 8 + speedIncrease;
        this.x -= this.speed;

        // Bird animation
        if (this.type === 'bird') {
            this.birdWingTimer++;
            if (this.birdWingTimer >= 15) {
                this.birdWingTimer = 0;
                this.birdWingFrame = (this.birdWingFrame + 1) % 2;
            }

            // Bird bobs up and down
            this.birdY = this.canvas.height - 140 + Math.sin(Date.now() * 0.005) * 20;
        }
    }

    draw() {
        this.ctx.save();

        if (this.type === 'cactus') {
            this.drawCactus();
        } else if (this.type === 'bird') {
            this.drawBird();
        }

        this.ctx.restore();
    }

    drawCactus() {
        const { x, y, width, height } = this;

        // Main trunk
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(x, y - height, width, height);

        // Left arm
        this.ctx.fillRect(x - 10, y - height + 15, 12, 8);
        this.ctx.fillRect(x - 5, y - height + 5, 8, 15);

        // Right arm
        this.ctx.fillRect(x + width - 2, y - height + 25, 12, 8);
        this.ctx.fillRect(x + width + 2, y - height + 15, 8, 15);

        // Spikes
        this.ctx.fillStyle = '#2ecc71';
        const spikePositions = [
            [x + 5, y - height + 5],
            [x + 15, y - height + 10],
            [x + 10, y - height + 25],
            [x + 20, y - height + 30],
            [x + 12, y - height + 40]
        ];

        spikePositions.forEach(([sx, sy]) => {
            this.ctx.fillRect(sx - 1, sy - 3, 2, 3);
        });
    }

    drawBird() {
        const { x, width } = this;
        const y = this.birdY;

        this.ctx.fillStyle = '#e74c3c';

        // Body
        this.ctx.fillRect(x, y - 15, width, 25);

        // Beak
        this.ctx.fillStyle = '#f39c12';
        this.ctx.beginPath();
        this.ctx.moveTo(x - 10, y - 5);
        this.ctx.lineTo(x, y - 8);
        this.ctx.lineTo(x, y - 2);
        this.ctx.closePath();
        this.ctx.fill();

        // Wings with animation
        this.ctx.fillStyle = '#c0392b';
        if (this.birdWingFrame === 0) {
            // Wings up
            this.ctx.beginPath();
            this.ctx.moveTo(x + 10, y - 15);
            this.ctx.lineTo(x + 5, y - 30);
            this.ctx.lineTo(x + 20, y - 20);
            this.ctx.closePath();
            this.ctx.fill();
        } else {
            // Wings down
            this.ctx.beginPath();
            this.ctx.moveTo(x + 10, y + 10);
            this.ctx.lineTo(x + 5, y + 25);
            this.ctx.lineTo(x + 20, y + 15);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // Eye
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x + 25, y - 12, 6, 6);
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x + 27, y - 11, 2, 2);
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    getBounds() {
        if (this.type === 'bird') {
            return {
                x: this.x,
                y: this.birdY - 15,
                width: this.width,
                height: 25
            };
        } else {
            return {
                x: this.x,
                y: this.y - this.height,
                width: this.width,
                height: this.height
            };
        }
    }
}