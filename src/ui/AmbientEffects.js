// Ambient visual effects for each region: floating leaves, snow, mist, dust, pollen.
// Lightweight particle system that covers the viewport.

import { SCREEN_W, SCREEN_H } from '../utils/constants.js';

export class AmbientEffects {
    constructor(kind = 'leaves') {
        this.kind = kind;
        this.particles = [];
        this.spawnTimer = 0;
        this.time = 0;
        this.mistOffset = 0;
        this.init();
    }

    setKind(kind) {
        if (kind === this.kind) return;
        this.kind = kind;
        this.particles = [];
        this.init();
    }

    init() {
        const presets = {
            leaves: { count: 18, spawnRate: 400 },
            snow:   { count: 60, spawnRate: 80 },
            mist:   { count: 8, spawnRate: 1500 },
            sand:   { count: 35, spawnRate: 120 },
            pollen: { count: 25, spawnRate: 250 },
            dust:   { count: 30, spawnRate: 150 },
        };
        const p = presets[this.kind] || presets.leaves;
        this.maxCount = p.count;
        this.spawnRate = p.spawnRate;
        for (let i = 0; i < p.count; i++) {
            this.particles.push(this.makeParticle(true));
        }
    }

    makeParticle(initial = false) {
        const p = {};
        p.x = Math.random() * SCREEN_W;
        p.y = initial ? Math.random() * SCREEN_H : -10;
        p.life = Math.random() * 4000 + 3000;
        p.age = 0;
        p.phase = Math.random() * Math.PI * 2;

        switch (this.kind) {
            case 'snow':
                p.vx = (Math.random() - 0.5) * 0.02;
                p.vy = 0.02 + Math.random() * 0.03;
                p.size = 1 + Math.random() * 2;
                p.alpha = 0.6 + Math.random() * 0.4;
                p.color = '#ffffff';
                break;
            case 'leaves':
                p.vx = -0.01 - Math.random() * 0.02;
                p.vy = 0.015 + Math.random() * 0.02;
                p.size = 3 + Math.random() * 2;
                p.alpha = 0.8;
                p.color = Math.random() < 0.5 ? '#d28a28' : (Math.random() < 0.5 ? '#b04a18' : '#8a6a20');
                p.rot = Math.random() * Math.PI * 2;
                p.rotSpd = (Math.random() - 0.5) * 0.005;
                break;
            case 'sand':
                p.vx = 0.06 + Math.random() * 0.04;
                p.vy = (Math.random() - 0.5) * 0.01;
                p.size = 1 + Math.random();
                p.alpha = 0.4 + Math.random() * 0.3;
                p.color = '#e8c878';
                break;
            case 'pollen':
                p.vx = (Math.random() - 0.5) * 0.015;
                p.vy = -0.005 - Math.random() * 0.01;
                p.size = 1 + Math.random() * 1.5;
                p.alpha = 0.5 + Math.random() * 0.3;
                p.color = '#fff4a8';
                break;
            case 'mist':
                p.x = Math.random() * SCREEN_W;
                p.y = 40 + Math.random() * (SCREEN_H - 80);
                p.vx = 0.015 + Math.random() * 0.01;
                p.vy = 0;
                p.size = 40 + Math.random() * 40;
                p.alpha = 0.08 + Math.random() * 0.08;
                p.color = '#d0e0f0';
                p.life = 10000 + Math.random() * 5000;
                break;
            case 'dust':
                p.vx = 0.03 + Math.random() * 0.02;
                p.vy = -0.005 + (Math.random() - 0.5) * 0.01;
                p.size = 1 + Math.random() * 1.5;
                p.alpha = 0.3 + Math.random() * 0.3;
                p.color = '#d8c896';
                break;
        }
        return p;
    }

    update(dt) {
        this.time += dt;
        this.mistOffset = (this.mistOffset + dt * 0.01) % SCREEN_W;

        this.spawnTimer += dt;
        while (this.spawnTimer > this.spawnRate && this.particles.length < this.maxCount) {
            this.particles.push(this.makeParticle());
            this.spawnTimer -= this.spawnRate;
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.age += dt;

            // Drift
            p.x += p.vx * dt + Math.sin(p.phase + this.time * 0.001) * 0.05;
            p.y += p.vy * dt;
            if (p.rot !== undefined) p.rot += p.rotSpd * dt;

            // Cull off-screen or expired
            const off = p.x < -20 || p.x > SCREEN_W + 20 || p.y > SCREEN_H + 20 || p.age > p.life;
            if (off) this.particles.splice(i, 1);
        }
    }

    render(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            if (this.kind === 'mist') {
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                g.addColorStop(0, `rgba(208, 224, 240, ${p.alpha})`);
                g.addColorStop(1, 'rgba(208, 224, 240, 0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.kind === 'leaves') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    // Full-screen color tint applied after tiles for atmosphere
    renderTint(ctx, color) {
        if (!color) return;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }

    // Vignette for focus
    renderVignette(ctx) {
        const g = ctx.createRadialGradient(SCREEN_W / 2, SCREEN_H / 2, SCREEN_H * 0.35,
                                            SCREEN_W / 2, SCREEN_H / 2, SCREEN_H * 0.8);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    }
}
