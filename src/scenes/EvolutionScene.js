import { SCREEN_W, SCREEN_H, COLORS } from '../utils/constants.js';

export class EvolutionScene {
    constructor(cryptid, oldName, newName, oldColor, newColor, onComplete) {
        this.game = null;
        this.canvas = null;
        this.input = null;
        this.cryptid = cryptid;
        this.oldName = oldName;
        this.newName = newName;
        this.oldColor = oldColor;
        this.newColor = newColor;
        this.onComplete = onComplete;

        this.timer = 0;
        this.phase = 0; // 0=intro, 1=morphing, 2=flash, 3=result
        this.phaseTimer = 0;

        // Phase durations (ms)
        this.phaseDurations = [1000, 2000, 1000, Infinity];

        // Animation state
        this.spriteScale = 1;
        this.spriteColor = oldColor;
        this.flashAlpha = 0;
        this.spotlightRadius = 60;
        this.pulseSpeed = 3;

        // Particles
        this.particles = [];

        // Text
        this.displayText = '';
        this.textAlpha = 0;
        this.waitingForInput = false;
    }

    enter() {
        this.timer = 0;
        this.phase = 0;
        this.phaseTimer = 0;
        this.spriteScale = 1;
        this.spriteColor = this.oldColor;
        this.flashAlpha = 0;
        this.particles = [];
        this.displayText = `What? ${this.oldName} is evolving!`;
        this.textAlpha = 0;
        this.waitingForInput = false;
    }

    exit() {}
    resume() {}

    update(dt) {
        this.timer += dt;
        this.phaseTimer += dt;

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * (dt / 16);
            p.y += p.vy * (dt / 16);
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        if (this.phase === 0) {
            this.updatePhaseIntro(dt);
        } else if (this.phase === 1) {
            this.updatePhaseMorph(dt);
        } else if (this.phase === 2) {
            this.updatePhaseFlash(dt);
        } else if (this.phase === 3) {
            this.updatePhaseResult(dt);
        }
    }

    advancePhase() {
        this.phase++;
        this.phaseTimer = 0;

        if (this.phase === 1) {
            this.displayText = '';
        } else if (this.phase === 2) {
            this.flashAlpha = 1;
            this.spriteColor = this.newColor;
            this.spriteScale = 1;
        } else if (this.phase === 3) {
            this.displayText = `${this.oldName} evolved into ${this.newName}!`;
            this.textAlpha = 0;
            this.waitingForInput = true;
        }
    }

    updatePhaseIntro(dt) {
        // Fade in text
        this.textAlpha = Math.min(1, this.phaseTimer / 500);

        // Sprite pulses gently
        const pulseT = this.phaseTimer / 1000;
        this.spriteScale = 1 + Math.sin(pulseT * this.pulseSpeed * 2) * 0.08;

        // Spotlight breathes
        this.spotlightRadius = 60 + Math.sin(pulseT * 2) * 5;

        if (this.phaseTimer >= this.phaseDurations[0]) {
            this.advancePhase();
        }
    }

    updatePhaseMorph(dt) {
        const t = this.phaseTimer / this.phaseDurations[1]; // 0 to 1 over 2 seconds

        // Speed up oscillation over time
        const freq = 3 + t * 12;
        const osc = Math.sin(this.phaseTimer / 1000 * freq);

        // Alternate colors: blend between old and new, oscillating
        const useNew = osc > 0;
        this.spriteColor = useNew ? this.newColor : this.oldColor;

        // Scale grows and shrinks with increasing amplitude
        const scaleAmp = 0.1 + t * 0.25;
        this.spriteScale = 1 + Math.sin(this.phaseTimer / 1000 * freq * 0.7) * scaleAmp;

        // Spotlight pulses faster
        this.spotlightRadius = 60 + Math.sin(this.phaseTimer / 100) * (10 + t * 20);

        // Spawn white particles
        if (Math.random() < 0.15 + t * 0.4) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 40;
            this.particles.push({
                x: SCREEN_W / 2 + Math.cos(angle) * dist,
                y: SCREEN_H / 2 - 20 + Math.sin(angle) * dist,
                vx: -Math.cos(angle) * (1 + Math.random() * 2),
                vy: -Math.sin(angle) * (1 + Math.random() * 2),
                size: 2 + Math.random() * 3,
                life: 600 + Math.random() * 400,
                maxLife: 1000,
                alpha: 1,
                color: '#fff',
            });
        }

        // Flash builds toward end
        if (t > 0.8) {
            this.flashAlpha = (t - 0.8) / 0.2 * 0.6;
        }

        if (this.phaseTimer >= this.phaseDurations[1]) {
            this.advancePhase();
        }
    }

    updatePhaseFlash(dt) {
        const t = this.phaseTimer / this.phaseDurations[2]; // 0 to 1 over 1 second

        // Bright flash fades out
        if (t < 0.3) {
            this.flashAlpha = 1;
        } else {
            this.flashAlpha = Math.max(0, 1 - (t - 0.3) / 0.7);
        }

        // Sprite settles into new form
        this.spriteScale = 1 + (1 - t) * 0.3;
        this.spriteColor = this.newColor;

        // Spotlight expands then settles
        this.spotlightRadius = 60 + (1 - t) * 40;

        // Burst of particles at start
        if (this.phaseTimer < 100) {
            for (let i = 0; i < 8; i++) {
                const angle = Math.random() * Math.PI * 2;
                this.particles.push({
                    x: SCREEN_W / 2,
                    y: SCREEN_H / 2 - 20,
                    vx: Math.cos(angle) * (2 + Math.random() * 3),
                    vy: Math.sin(angle) * (2 + Math.random() * 3),
                    size: 3 + Math.random() * 4,
                    life: 800 + Math.random() * 600,
                    maxLife: 1400,
                    alpha: 1,
                    color: '#fff',
                });
            }
        }

        if (this.phaseTimer >= this.phaseDurations[2]) {
            this.advancePhase();
        }
    }

    updatePhaseResult(dt) {
        // Fade in result text
        this.textAlpha = Math.min(1, this.phaseTimer / 600);

        // Gentle idle float
        this.spriteScale = 1 + Math.sin(this.timer / 500) * 0.03;

        // Wait for input
        if (this.input.actionJustPressed && this.phaseTimer > 300) {
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    render(canvas) {
        // Dramatic black background
        canvas.fill(COLORS.black);

        // Spotlight effect: concentric circles getting lighter toward center
        const cx = SCREEN_W / 2;
        const cy = SCREEN_H / 2 - 20;
        const maxR = this.spotlightRadius + 60;

        for (let r = maxR; r > 0; r -= 8) {
            const ratio = 1 - (r / maxR);
            const brightness = Math.floor(ratio * 30);
            canvas.drawCircleUI(cx, cy, r, `rgba(${brightness},${brightness},${brightness + 10},0.15)`);
        }

        // Core spotlight glow
        canvas.drawCircleUI(cx, cy, this.spotlightRadius * 0.4, 'rgba(60,60,80,0.2)');

        // Particles (behind sprite)
        for (const p of this.particles) {
            if (p.alpha <= 0) continue;
            canvas.setAlpha(p.alpha * 0.8);
            canvas.drawCircleUI(p.x, p.y, p.size, p.color);
        }
        canvas.resetAlpha();

        // Cryptid sprite
        const spriteSize = 32 * this.spriteScale;
        canvas.drawCryptidSprite(cx, cy, spriteSize, this.spriteColor, null, false, this.cryptid.templateId);

        // Glow ring around sprite during morphing
        if (this.phase === 1) {
            const glowAlpha = 0.2 + Math.sin(this.timer / 150) * 0.15;
            canvas.setAlpha(glowAlpha);
            canvas.drawCircleUI(cx, cy, spriteSize + 12, '#fff');
            canvas.resetAlpha();
        }

        // White flash overlay
        if (this.flashAlpha > 0) {
            canvas.setAlpha(this.flashAlpha);
            canvas.drawRectUI(0, 0, SCREEN_W, SCREEN_H, '#fff');
            canvas.resetAlpha();
        }

        // Text box at bottom
        if (this.displayText) {
            canvas.setAlpha(this.textAlpha);
            canvas.drawRectUI(20, SCREEN_H - 60, SCREEN_W - 40, 40, 'rgba(0,0,0,0.85)');
            canvas.drawRectOutlineUI(20, SCREEN_H - 60, SCREEN_W - 40, 40, '#ff6b35', 2);
            canvas.drawTextShadow(
                this.displayText,
                SCREEN_W / 2, SCREEN_H - 48,
                COLORS.white, 14, 'center'
            );
            canvas.resetAlpha();

            // "Press A" prompt in result phase
            if (this.waitingForInput && this.phaseTimer > 300) {
                const blink = Math.sin(this.timer / 300) * 0.4 + 0.6;
                canvas.setAlpha(blink);
                canvas.drawText('Press A to continue', SCREEN_W / 2, SCREEN_H - 28, '#aaa', 9, 'center');
                canvas.resetAlpha();
            }
        }
    }
}
