export class Dino {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Dino dimensions
        this.width = 50;
        this.height = 50;
        this.x = 50;
        this.y = this.canvas.height - 100;

        // Physics
        this.velocityY = 0;
        this.gravity = 0.8;
        this.jumpPower = -15;
        this.isJumping = false;
        this.isDucking = false;

        // Animation
        this.legFrame = 0;
        this.legTimer = 0;
        this.legInterval = 10; // Change leg every 10 frames

        // Colors for simple drawing (until we add sprites)
        this.bodyColor = '#2d3436';
        this.eyeColor = '#ffffff';
        this.pupilColor = '#000000';
    }

    jump() {
        if (!this.isJumping) {
            this.velocityY = this.jumpPower;
            this.isJumping = true;
            this.isDucking = false;
        }
    }

    duck(state) {
        if (!this.isJumping) {
            this.isDucking = state;
            if (state) {
                this.height = 30;
                this.y = this.canvas.height - 80;
            } else {
                this.height = 50;
                this.y = this.canvas.height - 100;
            }
        }
    }

    update() {
        // Apply gravity
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // Ground collision
        const groundLevel = this.isDucking ?
            this.canvas.height - 80 :
            this.canvas.height - 100;

        if (this.y > groundLevel) {
            this.y = groundLevel;
            this.velocityY = 0;
            this.isJumping = false;
        }

        // Update leg animation
        if (!this.isJumping) {
            this.legTimer++;
            if (this.legTimer >= this.legInterval) {
                this.legTimer = 0;
                this.legFrame = (this.legFrame + 1) % 2;
            }
        }
    }

    draw() {
        this.ctx.save();

        // Draw body
        this.ctx.fillStyle = this.bodyColor;

        if (!this.isDucking) {
            // Standing/Running Dino
            this.drawStandingDino();
        } else {
            // Ducking Dino
            this.drawDuckingDino();
        }

        this.ctx.restore();
    }

    drawStandingDino() {
        const { x, y, width, height } = this;

        // Body
        this.ctx.fillStyle = '#2d3436';
        this.ctx.fillRect(x + 10, y + 10, 30, 30);

        // Head
        this.ctx.fillRect(x + 30, y, 20, 20);

        // Eye
        this.ctx.fillStyle = this.eyeColor;
        this.ctx.fillRect(x + 38, y + 4, 8, 8);
        this.ctx.fillStyle = this.pupilColor;
        this.ctx.fillRect(x + 41, y + 6, 3, 3);

        // Mouth (angry expression while running)
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 42, y + 16);
        this.ctx.lineTo(x + 48, y + 14);
        this.ctx.stroke();

        // Tail
        this.ctx.fillStyle = '#2d3436';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 10, y + 15);
        this.ctx.lineTo(x - 5, y + 5);
        this.ctx.lineTo(x - 5, y + 20);
        this.ctx.closePath();
        this.ctx.fill();

        // Arms
        this.ctx.strokeStyle = '#2d3436';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 25, y + 20);
        this.ctx.lineTo(x + 20, y + 28);
        this.ctx.stroke();

        // Legs with animation
        this.ctx.strokeStyle = '#2d3436';
        this.ctx.lineWidth = 4;

        if (this.legFrame === 0) {
            // Legs apart
            this.ctx.beginPath();
            this.ctx.moveTo(x + 15, y + 40);
            this.ctx.lineTo(x + 10, y + 50);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(x + 25, y + 40);
            this.ctx.lineTo(x + 30, y + 50);
            this.ctx.stroke();
        } else {
            // Legs together
            this.ctx.beginPath();
            this.ctx.moveTo(x + 15, y + 40);
            this.ctx.lineTo(x + 20, y + 50);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(x + 25, y + 40);
            this.ctx.lineTo(x + 20, y + 50);
            this.ctx.stroke();
        }
    }

    drawDuckingDino() {
        const { x, y } = this;

        // Lower and wider body
        this.ctx.fillStyle = '#2d3436';
        this.ctx.fillRect(x + 10, y + 5, 40, 25);

        // Head (pulled down)
        this.ctx.fillRect(x + 35, y, 15, 15);

        // Eye (squinting)
        this.ctx.fillStyle = this.eyeColor;
        this.ctx.fillRect(x + 40, y + 3, 6, 4);
        this.ctx.fillStyle = this.pupilColor;
        this.ctx.fillRect(x + 42, y + 3, 2, 3);

        // Tail
        this.ctx.fillStyle = '#2d3436';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 10, y + 10);
        this.ctx.lineTo(x - 2, y + 15);
        this.ctx.lineTo(x + 5, y + 25);
        this.ctx.closePath();
        this.ctx.fill();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    reset() {
        this.y = this.canvas.height - 100;
        this.velocityY = 0;
        this.isJumping = false;
        this.isDucking = false;
        this.height = 50;
        this.legFrame = 0;
        this.legTimer = 0;
    }
}