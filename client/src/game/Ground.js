export class Ground {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.y = canvas.height - 50;
        this.width = canvas.width;
        this.height = 50;
        this.x = 0;
        this.speed = 8;

        // Ground texture pattern
        this.groundColor = '#8B7355';
        this.grassColor = '#4a7c2e';
    }

    update(speedIncrease = 0) {
        this.speed = 8 + speedIncrease;
        this.x -= this.speed;

        // Reset position for seamless scrolling
        if (this.x <= -this.width) {
            this.x = 0;
        }
    }

    draw() {
        this.ctx.save();

        // Draw two ground segments for seamless scrolling
        for (let i = 0; i < 3; i++) {
            const xPos = this.x + (i * this.width);

            // Main ground
            this.ctx.fillStyle = this.groundColor;
            this.ctx.fillRect(xPos, this.y + 10, this.width, this.height - 10);

            // Grass on top
            this.ctx.fillStyle = this.grassColor;
            this.ctx.fillRect(xPos, this.y, this.width, 15);

            // Ground texture (small dots)
            this.ctx.fillStyle = '#7a6548';
            for (let j = 0; j < 10; j++) {
                const dotX = xPos + Math.random() * this.width;
                const dotY = this.y + 20 + Math.random() * 20;
                this.ctx.fillRect(dotX, dotY, 2, 2);
            }

            // Grass details
            this.ctx.strokeStyle = '#3d6b25';
            this.ctx.lineWidth = 1;
            for (let j = 0; j < 15; j++) {
                const grassX = xPos + j * 80;
                this.ctx.beginPath();
                this.ctx.moveTo(grassX, this.y + 10);
                this.ctx.lineTo(grassX - 3, this.y);
                this.ctx.moveTo(grassX + 5, this.y + 10);
                this.ctx.lineTo(grassX + 8, this.y + 2);
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }
}