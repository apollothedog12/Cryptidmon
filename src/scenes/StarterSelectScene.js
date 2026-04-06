import { SCREEN_W, SCREEN_H, COLORS, TYPE_COLORS } from '../utils/constants.js';

export class StarterSelectScene {
    constructor(starters, onSelect) {
        this.game = null;
        this.canvas = null;
        this.input = null;
        this.starters = starters; // array of 3 Cryptid instances
        this.onSelect = onSelect;

        this.selectedIndex = 1; // start on the middle card
        this.confirming = false;
        this.confirmed = false;

        // Animation state
        this.timer = 0;
        this.titleAlpha = 0;
        this.cardsAlpha = 0;
        this.cardOffsets = [0, 0, 0]; // vertical offset per card for entrance

        // Selection animation state
        this.selectionTimer = 0;
        this.selectionDuration = 2500;
        this.chosenBounceY = 0;
        this.fadeOutAlpha = [1, 1, 1]; // alpha per card during fade
        this.confetti = [];
        this.resultText = '';
        this.resultTextAlpha = 0;

        // Navigation debounce
        this._prevLeft = false;
        this._prevRight = false;

        // Starter descriptions
        this.descriptions = [
            'Balanced stats with\ngreat endurance.',
            'Fast & hits hard\nwith special moves.',
            'Tanky defender\nwith high HP.',
        ];
    }

    enter() {
        this.timer = 0;
        this.selectedIndex = 1;
        this.confirming = false;
        this.confirmed = false;
        this.selectionTimer = 0;
        this.confetti = [];
        this.cardOffsets = [40, 60, 80];
        this.fadeOutAlpha = [1, 1, 1];
        this.resultTextAlpha = 0;
    }

    exit() {}
    resume() {}

    update(dt) {
        this.timer += dt;

        // Entrance animations
        this.titleAlpha = Math.min(1, this.timer / 600);
        this.cardsAlpha = Math.min(1, (this.timer - 200) / 500);

        // Card entrance slide up
        for (let i = 0; i < 3; i++) {
            if (this.cardOffsets[i] > 0) {
                this.cardOffsets[i] = Math.max(0, this.cardOffsets[i] - dt * 0.15);
            }
        }

        // If confirmed, run selection animation
        if (this.confirmed) {
            this.updateSelectionAnimation(dt);
            return;
        }

        // If confirming, handle confirm prompt
        if (this.confirming) {
            if (this.input.actionJustPressed) {
                this.confirmSelection();
            } else if (this.input.cancelJustPressed) {
                this.confirming = false;
            }
            return;
        }

        // Navigation
        const leftPressed = this.input.direction.x < 0;
        const rightPressed = this.input.direction.x > 0;

        if (leftPressed && !this._prevLeft) {
            this.selectedIndex = (this.selectedIndex - 1 + 3) % 3;
        }
        if (rightPressed && !this._prevRight) {
            this.selectedIndex = (this.selectedIndex + 1) % 3;
        }
        this._prevLeft = leftPressed;
        this._prevRight = rightPressed;

        // Select
        if (this.input.actionJustPressed) {
            this.confirming = true;
        }

        // Cancel goes back (optional: could go back to title)
        if (this.input.cancelJustPressed) {
            // No-op or could call a back callback
        }
    }

    confirmSelection() {
        this.confirmed = true;
        this.selectionTimer = 0;
        this.resultText = `You chose ${this.starters[this.selectedIndex].displayName}!`;

        // Spawn confetti particles
        for (let i = 0; i < 60; i++) {
            this.confetti.push({
                x: SCREEN_W / 2 + (Math.random() - 0.5) * 200,
                y: SCREEN_H / 2 - 40,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3 - 1,
                gravity: 0.08,
                size: Math.random() * 4 + 2,
                color: this._randomConfettiColor(),
                alpha: 1,
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 8,
            });
        }
    }

    _randomConfettiColor() {
        const colors = ['#ff6b35', '#ffd700', '#4caf50', '#42a5f5', '#f44336', '#ab47bc', '#ff9800', '#e0e0e0'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateSelectionAnimation(dt) {
        this.selectionTimer += dt;
        const t = this.selectionTimer;

        // Chosen card bounces up
        const bounceProg = Math.min(1, t / 600);
        this.chosenBounceY = -30 * Math.sin(bounceProg * Math.PI);
        if (bounceProg >= 1) {
            // Settle with gentle float
            const floatT = (t - 600) / 1000;
            this.chosenBounceY = -20 + Math.sin(floatT * 3) * 4;
        }

        // Fade out non-selected cards
        for (let i = 0; i < 3; i++) {
            if (i !== this.selectedIndex) {
                this.fadeOutAlpha[i] = Math.max(0, 1 - (t / 800));
            }
        }

        // Result text fades in
        if (t > 400) {
            this.resultTextAlpha = Math.min(1, (t - 400) / 500);
        }

        // Update confetti
        for (const p of this.confetti) {
            p.x += p.vx;
            p.vy += p.gravity;
            p.y += p.vy;
            p.rotation += p.rotSpeed;
            if (t > 1500) {
                p.alpha = Math.max(0, p.alpha - dt * 0.002);
            }
        }

        // After animation completes, fire callback
        if (t >= this.selectionDuration) {
            if (this.onSelect) {
                this.onSelect(this.starters[this.selectedIndex], this.selectedIndex);
            }
        }
    }

    render(canvas) {
        // Background
        canvas.fill(COLORS.bg);

        // Subtle starry background
        const starCount = 30;
        for (let i = 0; i < starCount; i++) {
            const sx = ((i * 137 + 43) % SCREEN_W);
            const sy = ((i * 89 + 17) % (SCREEN_H * 0.4));
            const twinkle = Math.sin(this.timer / 800 + i * 0.7) * 0.3 + 0.5;
            canvas.setAlpha(twinkle);
            canvas.drawRectUI(sx, sy, 2, 2, '#fff');
        }
        canvas.resetAlpha();

        // Title
        canvas.setAlpha(this.titleAlpha);
        canvas.drawTextShadow('Choose Your Partner!', SCREEN_W / 2, 20, '#ff6b35', 22, 'center');
        canvas.resetAlpha();

        // Draw cards
        canvas.setAlpha(Math.max(0, this.cardsAlpha));
        this.renderCards(canvas);
        canvas.resetAlpha();

        // Confirm prompt
        if (this.confirming && !this.confirmed) {
            this.renderConfirmPrompt(canvas);
        }

        // Confetti
        if (this.confirmed) {
            this.renderConfetti(canvas);

            // Result text
            if (this.resultTextAlpha > 0) {
                canvas.setAlpha(this.resultTextAlpha);
                canvas.drawRectUI(SCREEN_W / 2 - 130, SCREEN_H - 55, 260, 32, 'rgba(0,0,0,0.7)');
                canvas.drawRectOutlineUI(SCREEN_W / 2 - 130, SCREEN_H - 55, 260, 32, '#ff6b35', 2);
                canvas.drawTextShadow(this.resultText, SCREEN_W / 2, SCREEN_H - 47, '#ffd700', 16, 'center');
                canvas.resetAlpha();
            }
        }

        // Controls hint at bottom
        if (!this.confirmed) {
            canvas.drawText(
                this.confirming ? 'A: Confirm   B: Back' : 'Left/Right: Browse   A: Select',
                SCREEN_W / 2, SCREEN_H - 16, '#555', 9, 'center'
            );
        }
    }

    renderCards(canvas) {
        const cardW = 120;
        const cardH = 180;
        const spacing = 16;
        const totalW = cardW * 3 + spacing * 2;
        const startX = (SCREEN_W - totalW) / 2;
        const baseY = 55;

        for (let i = 0; i < 3; i++) {
            const starter = this.starters[i];
            const isSelected = i === this.selectedIndex;
            const x = startX + i * (cardW + spacing);
            let y = baseY + this.cardOffsets[i];

            // Apply selection animation offset
            if (this.confirmed) {
                canvas.setAlpha(this.fadeOutAlpha[i]);
                if (i === this.selectedIndex) {
                    y += this.chosenBounceY;
                }
            }

            // Card background
            const bgColor = isSelected && !this.confirmed
                ? 'rgba(40,40,70,0.95)'
                : 'rgba(25,25,50,0.85)';
            canvas.drawRectUI(x, y, cardW, cardH, bgColor);

            // Selected border glow
            if (isSelected) {
                const pulse = Math.sin(this.timer / 300) * 0.3 + 0.7;
                canvas.setAlpha(this.confirmed ? this.fadeOutAlpha[i] : pulse);
                canvas.drawRectOutlineUI(x - 1, y - 1, cardW + 2, cardH + 2, '#ff6b35', 2);
                canvas.resetAlpha();
                if (this.confirmed) {
                    canvas.setAlpha(this.fadeOutAlpha[i]);
                }
            } else {
                canvas.drawRectOutlineUI(x, y, cardW, cardH, 'rgba(255,255,255,0.15)', 1);
            }

            // Sprite area background
            const spriteAreaY = y + 8;
            const spriteAreaH = 70;
            canvas.drawRectUI(x + 8, spriteAreaY, cardW - 16, spriteAreaH, 'rgba(0,0,0,0.3)');

            // Draw cryptid sprite
            const spriteX = x + cardW / 2;
            const spriteY = spriteAreaY + spriteAreaH / 2;
            const bob = isSelected ? Math.sin(this.timer / 400) * 3 : 0;
            canvas.drawCryptidSprite(spriteX, spriteY + bob, 30, starter.spriteColor, null, false, starter.templateId);

            // Name
            canvas.drawTextShadow(
                starter.displayName,
                x + cardW / 2, y + 84,
                COLORS.white, 13, 'center'
            );

            // Type badges
            const typeY = y + 102;
            const types = starter.types;
            const badgeW = types.length > 1 ? 48 : 60;
            const totalBadgeW = types.length * badgeW + (types.length - 1) * 4;
            const badgeStartX = x + (cardW - totalBadgeW) / 2;

            for (let t = 0; t < types.length; t++) {
                const bx = badgeStartX + t * (badgeW + 4);
                const typeColor = TYPE_COLORS[types[t]] || '#888';
                canvas.drawRectUI(bx, typeY, badgeW, 14, typeColor);
                canvas.drawText(
                    types[t].charAt(0).toUpperCase() + types[t].slice(1),
                    bx + badgeW / 2, typeY + 2,
                    '#fff', 9, 'center'
                );
            }

            // Description text
            const descLines = this.descriptions[i].split('\n');
            for (let d = 0; d < descLines.length; d++) {
                canvas.drawText(
                    descLines[d],
                    x + cardW / 2, y + 124 + d * 14,
                    '#aaa', 9, 'center'
                );
            }

            // Selection arrow above selected card
            if (isSelected && !this.confirmed && !this.confirming) {
                const arrowBob = Math.sin(this.timer / 250) * 3;
                canvas.drawTextShadow(
                    'v',
                    x + cardW / 2, y - 16 + arrowBob,
                    '#ff6b35', 14, 'center'
                );
            }

            // Restore alpha after per-card fade
            if (this.confirmed) {
                canvas.resetAlpha();
            }
        }
    }

    renderConfirmPrompt(canvas) {
        // Overlay
        canvas.drawRectUI(0, 0, SCREEN_W, SCREEN_H, 'rgba(0,0,0,0.5)');

        // Prompt box
        const boxW = 240;
        const boxH = 60;
        const boxX = (SCREEN_W - boxW) / 2;
        const boxY = (SCREEN_H - boxH) / 2;

        canvas.drawRectUI(boxX, boxY, boxW, boxH, 'rgba(15,15,40,0.95)');
        canvas.drawRectOutlineUI(boxX, boxY, boxW, boxH, '#ff6b35', 2);

        const name = this.starters[this.selectedIndex].displayName;
        canvas.drawTextShadow(
            `Choose ${name}?`,
            SCREEN_W / 2, boxY + 12,
            COLORS.white, 14, 'center'
        );
        canvas.drawText(
            'A: Yes   B: No',
            SCREEN_W / 2, boxY + 36,
            '#aaa', 11, 'center'
        );
    }

    renderConfetti(canvas) {
        for (const p of this.confetti) {
            if (p.alpha <= 0) continue;
            canvas.setAlpha(p.alpha);
            canvas.ctx.save();
            canvas.ctx.translate(p.x, p.y);
            canvas.ctx.rotate(p.rotation * Math.PI / 180);
            canvas.ctx.fillStyle = p.color;
            canvas.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            canvas.ctx.restore();
        }
        canvas.resetAlpha();
    }
}
