export class Cloud {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.x = canvas.width + Math.random() * 200;
        this.y = 30 + Math.random() * 100;
        this.width = 60 + Math.random() * 40;
        this.height = 20 + Math.random() * 15;
        this.speed = 1 + Math.random() * 2;
        this.opacity = 0.3 + Math.random() * 0.4;
    }

    update(speedIncrease = 0) {
        this.speed = (1 + Math.random() * 2) + (speedIncrease * 0.2);
        this.x -= this.speed;
    }

    draw() {
        this.ctx.save();
        this.ctx.globalAlpha = this.opacity;

        // Cloud body (multiple circles)
        this.ctx.fillStyle = '#ffffff';

        // Main body
        this.ctx.beginPath();
        this.ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.5,
            this.width * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        // Smaller circles for fluffy appearance
        this.ctx.beginPath();
        this.ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.3,
            this.width * 0.2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.4,
            this.width * 0.25, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(this.x + this.width * 0.5, this.y + this.height * 0.2,
            this.width * 0.22, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    reset() {
        this.x = this.canvas.width + Math.random() * 200;
        this.y = 30 + Math.random() * 100;
    }
}