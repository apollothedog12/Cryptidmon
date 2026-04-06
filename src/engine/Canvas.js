import { SCREEN_W, SCREEN_H, TILE_SIZE } from '../utils/constants.js';

export class Canvas {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = SCREEN_W;
        this.canvas.height = SCREEN_H;
        this.ctx.imageSmoothingEnabled = false;
        this.camera = { x: 0, y: 0 };
        this.shake = { x: 0, y: 0, duration: 0 };
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const ratio = SCREEN_W / SCREEN_H;
        let w = window.innerWidth;
        let h = window.innerHeight;
        if (w / h > ratio) {
            w = h * ratio;
        } else {
            h = w / ratio;
        }
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.scaleX = SCREEN_W / w;
        this.scaleY = SCREEN_H / h;
        this.offsetX = (window.innerWidth - w) / 2;
        this.offsetY = (window.innerHeight - h) / 2;
    }

    screenToWorld(sx, sy) {
        return {
            x: (sx - this.offsetX) * this.scaleX + this.camera.x,
            y: (sy - this.offsetY) * this.scaleY + this.camera.y,
        };
    }

    screenToCanvas(sx, sy) {
        return {
            x: (sx - this.offsetX) * this.scaleX,
            y: (sy - this.offsetY) * this.scaleY,
        };
    }

    clear() {
        this.ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);
    }

    fill(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }

    startShake(duration = 300, intensity = 4) {
        this.shake.duration = duration;
        this.shake.intensity = intensity;
    }

    updateShake(dt) {
        if (this.shake.duration > 0) {
            this.shake.duration -= dt;
            this.shake.x = (Math.random() - 0.5) * this.shake.intensity;
            this.shake.y = (Math.random() - 0.5) * this.shake.intensity;
        } else {
            this.shake.x = 0;
            this.shake.y = 0;
        }
    }

    drawRect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            Math.floor(x - this.camera.x + this.shake.x),
            Math.floor(y - this.camera.y + this.shake.y),
            w, h
        );
    }

    drawRectUI(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
    }

    drawRectOutline(x, y, w, h, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeRect(
            Math.floor(x - this.camera.x + this.shake.x),
            Math.floor(y - this.camera.y + this.shake.y),
            w, h
        );
    }

    drawRectOutlineUI(x, y, w, h, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeRect(Math.floor(x), Math.floor(y), w, h);
    }

    drawCircle(x, y, r, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(
            Math.floor(x - this.camera.x + this.shake.x),
            Math.floor(y - this.camera.y + this.shake.y),
            r, 0, Math.PI * 2
        );
        this.ctx.fill();
    }

    drawCircleUI(x, y, r, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(Math.floor(x), Math.floor(y), r, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawText(text, x, y, color = '#fff', size = 14, align = 'left', font = 'monospace') {
        this.ctx.fillStyle = color;
        this.ctx.font = `${size}px ${font}`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(text, Math.floor(x), Math.floor(y));
    }

    drawTextShadow(text, x, y, color = '#fff', size = 14, align = 'left') {
        this.drawText(text, x + 1, y + 1, 'rgba(0,0,0,0.7)', size, align);
        this.drawText(text, x, y, color, size, align);
    }

    drawBar(x, y, w, h, ratio, fgColor, bgColor = '#333') {
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
        this.ctx.fillStyle = fgColor;
        this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w * Math.max(0, ratio)), h);
    }

    drawCryptidSprite(x, y, size, color, name, isBack = false) {
        const cx = Math.floor(x);
        const cy = Math.floor(y);
        const s = size;

        // Body
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy + s * 0.1, s * 0.4, s * 0.45, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Darker shade for depth
        this.ctx.fillStyle = this.darkenColor(color, 30);
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy + s * 0.25, s * 0.35, s * 0.25, 0, 0, Math.PI * 2);
        this.ctx.fill();

        if (!isBack) {
            // Eyes
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.ellipse(cx - s * 0.15, cy - s * 0.1, s * 0.08, s * 0.1, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(cx + s * 0.15, cy - s * 0.1, s * 0.08, s * 0.1, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Pupils
            this.ctx.fillStyle = '#111';
            this.ctx.beginPath();
            this.ctx.arc(cx - s * 0.13, cy - s * 0.08, s * 0.04, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(cx + s * 0.17, cy - s * 0.08, s * 0.04, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Shadow beneath
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy + s * 0.5, s * 0.35, s * 0.08, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Name label
        if (name) {
            this.drawText(name, cx, cy + s * 0.55, '#fff', 10, 'center');
        }
    }

    darkenColor(hex, amount) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.max(0, r - amount);
        g = Math.max(0, g - amount);
        b = Math.max(0, b - amount);
        return `rgb(${r},${g},${b})`;
    }

    lightenColor(hex, amount) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.min(255, r + amount);
        g = Math.min(255, g + amount);
        b = Math.min(255, b + amount);
        return `rgb(${r},${g},${b})`;
    }

    setAlpha(a) {
        this.ctx.globalAlpha = a;
    }

    resetAlpha() {
        this.ctx.globalAlpha = 1;
    }

    save() { this.ctx.save(); }
    restore() { this.ctx.restore(); }
}
