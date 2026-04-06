import { SCREEN_W, SCREEN_H, COLORS } from '../utils/constants.js';

export class TitleScene {
    constructor() {
        this.game = null;
        this.canvas = null;
        this.input = null;
        this.menuIndex = 0;
        this.menuItems = ['New Game', 'Continue', 'About'];
        this.titleY = -50;
        this.titleTargetY = 60;
        this.starAlpha = 0;
        this.timer = 0;
        this.stars = [];
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * SCREEN_W,
                y: Math.random() * SCREEN_H * 0.6,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.2,
                phase: Math.random() * Math.PI * 2,
            });
        }
    }

    enter() {
        this.menuIndex = 0;
        // Check for save data
        if (!this.game.save.hasSave(0) && !this.game.save.hasSave(1) && !this.game.save.hasSave(2)) {
            this.menuItems = ['New Game', 'About'];
        } else {
            this.menuItems = ['Continue', 'New Game', 'About'];
        }
    }

    exit() {}
    resume() {}

    update(dt) {
        this.timer += dt;
        this.starAlpha = Math.min(1, this.timer / 1000);

        // Animate title
        if (this.titleY < this.titleTargetY) {
            this.titleY += (this.titleTargetY - this.titleY) * 0.05;
        }

        // Menu navigation
        if (this.input.direction.y < 0 && !this._prevUp) {
            this.menuIndex = (this.menuIndex - 1 + this.menuItems.length) % this.menuItems.length;
        }
        if (this.input.direction.y > 0 && !this._prevDown) {
            this.menuIndex = (this.menuIndex + 1) % this.menuItems.length;
        }
        this._prevUp = this.input.direction.y < 0;
        this._prevDown = this.input.direction.y > 0;

        if (this.input.actionJustPressed) {
            this.selectMenuItem();
        }
    }

    selectMenuItem() {
        const item = this.menuItems[this.menuIndex];
        if (item === 'New Game') {
            this.startNewGame();
        } else if (item === 'Continue') {
            this.continueGame();
        } else if (item === 'About') {
            // Show about info inline
        }
    }

    startNewGame() {
        // Dispatch to the main game - will be handled by main.js
        if (this.game.onNewGame) {
            this.game.onNewGame();
        }
    }

    continueGame() {
        // Load most recent save
        for (let i = 0; i < 3; i++) {
            if (this.game.save.hasSave(i)) {
                if (this.game.onContinue) {
                    this.game.onContinue(i);
                }
                return;
            }
        }
    }

    render(canvas) {
        // Background gradient
        canvas.fill('#0a0a1a');

        // Stars
        canvas.setAlpha(this.starAlpha);
        for (const star of this.stars) {
            const twinkle = Math.sin(this.timer / 1000 * star.speed + star.phase) * 0.3 + 0.7;
            canvas.setAlpha(twinkle * this.starAlpha);
            canvas.drawRectUI(star.x, star.y, star.size, star.size, '#fff');
        }
        canvas.resetAlpha();

        // Title
        canvas.drawTextShadow('CRYPTIDMON', SCREEN_W / 2, this.titleY, '#ff6b35', 32, 'center');
        canvas.drawTextShadow('Legends of the Unknown', SCREEN_W / 2, this.titleY + 36, '#aaa', 12, 'center');

        // Decorative cryptid silhouettes
        const breathe = Math.sin(this.timer / 1000) * 3;
        canvas.drawCircleUI(120, 150 + breathe, 20, 'rgba(112,88,152,0.3)');
        canvas.drawCircleUI(360, 145 + breathe, 25, 'rgba(104,144,240,0.3)');
        canvas.drawCircleUI(240, 155 + breathe, 18, 'rgba(120,200,80,0.3)');

        // Menu
        const menuY = 180;
        for (let i = 0; i < this.menuItems.length; i++) {
            const isSelected = i === this.menuIndex;
            const y = menuY + i * 30;
            const bounce = isSelected ? Math.sin(this.timer / 200) * 2 : 0;

            if (isSelected) {
                canvas.drawRectUI(SCREEN_W / 2 - 80, y - 2, 160, 24, 'rgba(255,107,53,0.3)');
                canvas.drawRectOutlineUI(SCREEN_W / 2 - 80, y - 2, 160, 24, '#ff6b35', 2);
                canvas.drawTextShadow('> ' + this.menuItems[i], SCREEN_W / 2, y + 3 + bounce, '#ff6b35', 14, 'center');
            } else {
                canvas.drawTextShadow(this.menuItems[i], SCREEN_W / 2, y + 3, '#888', 14, 'center');
            }
        }

        // Controls hint
        canvas.drawText('Arrow Keys/D-Pad to navigate, Z/Tap to select', SCREEN_W / 2, SCREEN_H - 20, '#555', 9, 'center');
    }
}
