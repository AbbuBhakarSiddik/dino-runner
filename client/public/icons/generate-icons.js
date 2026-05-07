document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.addEventListener('click', generateAllIcons);
});

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function drawIcon(size) {
    const canvas = document.getElementById('iconCanvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Draw a simple ground line
    ctx.fillStyle = '#4a7c2e';
    ctx.fillRect(0, size * 0.8, size, size * 0.2);

    // Draw a simple dino shape
    const centerX = size / 2;
    const centerY = size * 0.45;

    // Body
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(centerX - size * 0.15, centerY - size * 0.1, size * 0.25, size * 0.2);

    // Head
    ctx.fillRect(centerX + size * 0.08, centerY - size * 0.2, size * 0.12, size * 0.12);

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(centerX + size * 0.13, centerY - size * 0.17, size * 0.04, size * 0.04);

    // Legs
    ctx.fillStyle = '#2d3436';
    const legWidth = size * 0.03;
    const legHeight = size * 0.15;
    ctx.fillRect(centerX - size * 0.1, centerY + size * 0.1, legWidth, legHeight);
    ctx.fillRect(centerX, centerY + size * 0.1, legWidth, legHeight);

    // Tail
    ctx.beginPath();
    ctx.moveTo(centerX - size * 0.15, centerY);
    ctx.lineTo(centerX - size * 0.25, centerY - size * 0.1);
    ctx.lineTo(centerX - size * 0.2, centerY + size * 0.05);
    ctx.closePath();
    ctx.fill();

    return canvas.toDataURL('image/png');
}

function downloadIcon(dataUrl, size) {
    const link = document.createElement('a');
    link.download = `icon-${size}x${size}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateAllIcons() {
    const preview = document.getElementById('preview');
    preview.innerHTML = '';

    // Show success message
    const message = document.createElement('div');
    message.className = 'success-message';
    message.textContent = '✅ Icons are being generated and downloaded!';
    preview.appendChild(message);

    sizes.forEach((size, index) => {
        setTimeout(() => {
            const dataUrl = drawIcon(size);

            // Add preview
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';

            const img = document.createElement('img');
            img.src = dataUrl;
            img.width = Math.min(size, 100);
            img.height = Math.min(size, 100);
            img.alt = `Icon ${size}x${size}`;

            const label = document.createElement('span');
            label.textContent = `${size}x${size}`;

            previewItem.appendChild(img);
            previewItem.appendChild(label);
            preview.appendChild(previewItem);

            // Download
            downloadIcon(dataUrl, size);

            if (index === sizes.length - 1) {
                setTimeout(() => {
                    message.textContent = '✅ All icons generated! Save them to your public/icons folder and rename to: icon-72x72.png, icon-96x96.png, etc.';
                }, 500);
            }
        }, index * 200);
    });
}