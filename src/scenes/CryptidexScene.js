import { SCREEN_W, SCREEN_H, COLORS, TYPE_COLORS } from '../utils/constants.js';

export class CryptidexScene {
    constructor(allCryptids, seenSet, caughtSet) {
        this.game = null;
        this.canvas = null;
        this.input = null;
        this.allCryptids = allCryptids; // array of all cryptid base data
        this.seenSet = seenSet;         // Set of seen cryptid ids
        this.caughtSet = caughtSet;     // Set of caught cryptid ids

        this.cursorIndex = 0;
        this.scrollRow = 0;
        this.viewingDetail = false;

        this.cols = 8;
        this.cellSize = 44;
        this.cellPadding = 6;
        this.gridX = 28;
        this.gridY = 50;
        this.visibleRows = 5;

        // Navigation debounce
        this._prevLeft = false;
        this._prevRight = false;
        this._prevUp = false;
        this._prevDown = false;

        this.timer = 0;
    }

    enter() {
        this.cursorIndex = 0;
        this.scrollRow = 0;
        this.viewingDetail = false;
        this.timer = 0;
    }

    exit() {}
    resume() {}

    get totalEntries() {
        return this.allCryptids.length;
    }

    get totalRows() {
        return Math.ceil(this.totalEntries / this.cols);
    }

    update(dt) {
        this.timer += dt;

        const leftPressed = this.input.direction.x < 0;
        const rightPressed = this.input.direction.x > 0;
        const upPressed = this.input.direction.y < 0;
        const downPressed = this.input.direction.y > 0;

        if (this.input.cancelJustPressed) {
            if (this.viewingDetail) {
                this.viewingDetail = false;
            } else {
                this.game.popScene();
            }
            return;
        }

        if (this.viewingDetail) {
            // In detail view, left/right to browse caught cryptids
            if (leftPressed && !this._prevLeft) {
                this.browseCaught(-1);
            }
            if (rightPressed && !this._prevRight) {
                this.browseCaught(1);
            }
            this._prevLeft = leftPressed;
            this._prevRight = rightPressed;
            this._prevUp = upPressed;
            this._prevDown = downPressed;
            return;
        }

        // Grid navigation
        if (leftPressed && !this._prevLeft) {
            if (this.cursorIndex % this.cols > 0) {
                this.cursorIndex--;
            }
        }
        if (rightPressed && !this._prevRight) {
            if (this.cursorIndex % this.cols < this.cols - 1 && this.cursorIndex + 1 < this.totalEntries) {
                this.cursorIndex++;
            }
        }
        if (upPressed && !this._prevUp) {
            if (this.cursorIndex - this.cols >= 0) {
                this.cursorIndex -= this.cols;
            }
        }
        if (downPressed && !this._prevDown) {
            if (this.cursorIndex + this.cols < this.totalEntries) {
                this.cursorIndex += this.cols;
            }
        }

        // Clamp cursor
        this.cursorIndex = Math.max(0, Math.min(this.cursorIndex, this.totalEntries - 1));

        // Scroll to keep cursor visible
        const cursorRow = Math.floor(this.cursorIndex / this.cols);
        if (cursorRow < this.scrollRow) {
            this.scrollRow = cursorRow;
        }
        if (cursorRow >= this.scrollRow + this.visibleRows) {
            this.scrollRow = cursorRow - this.visibleRows + 1;
        }

        this._prevLeft = leftPressed;
        this._prevRight = rightPressed;
        this._prevUp = upPressed;
        this._prevDown = downPressed;

        // Action: view detail if caught
        if (this.input.actionJustPressed) {
            const cryptid = this.allCryptids[this.cursorIndex];
            if (cryptid && this.caughtSet.has(cryptid.id)) {
                this.viewingDetail = true;
            }
        }
    }

    browseCaught(direction) {
        let idx = this.cursorIndex;
        for (let attempts = 0; attempts < this.totalEntries; attempts++) {
            idx += direction;
            if (idx < 0) idx = this.totalEntries - 1;
            if (idx >= this.totalEntries) idx = 0;
            const cryptid = this.allCryptids[idx];
            if (cryptid && this.caughtSet.has(cryptid.id)) {
                this.cursorIndex = idx;
                return;
            }
        }
    }

    render(canvas) {
        // Background
        canvas.fill(COLORS.bg);

        // Header
        const caughtCount = this.caughtSet.size;
        const seenCount = this.seenSet.size;
        const total = this.totalEntries || 76;
        canvas.drawTextShadow(
            `Cryptidex - Caught: ${caughtCount}/${total}  Seen: ${seenCount}/${total}`,
            SCREEN_W / 2, 12, '#ff6b35', 14, 'center'
        );

        // Divider
        canvas.drawRectUI(20, 34, SCREEN_W - 40, 1, 'rgba(255,255,255,0.15)');

        if (this.viewingDetail) {
            this.renderDetail(canvas);
        } else {
            this.renderGrid(canvas);
        }

        // Controls hint
        const hint = this.viewingDetail
            ? 'L/R: Browse   B: Back'
            : 'D-Pad: Navigate   A: View   B: Exit';
        canvas.drawText(hint, SCREEN_W / 2, SCREEN_H - 10, '#555', 9, 'center');
    }

    renderGrid(canvas) {
        const startRow = this.scrollRow;
        const endRow = Math.min(startRow + this.visibleRows, this.totalRows);

        for (let row = startRow; row < endRow; row++) {
            for (let col = 0; col < this.cols; col++) {
                const idx = row * this.cols + col;
                if (idx >= this.totalEntries) break;

                const cryptid = this.allCryptids[idx];
                const cx = this.gridX + col * (this.cellSize + this.cellPadding);
                const cy = this.gridY + (row - startRow) * (this.cellSize + this.cellPadding);
                const isSelected = idx === this.cursorIndex;
                const isCaught = this.caughtSet.has(cryptid.id);
                const isSeen = this.seenSet.has(cryptid.id);

                // Cell background
                if (isSelected) {
                    canvas.drawRectUI(cx, cy, this.cellSize, this.cellSize, 'rgba(255,107,53,0.25)');
                    const pulse = Math.sin(this.timer / 300) * 0.3 + 0.7;
                    canvas.setAlpha(pulse);
                    canvas.drawRectOutlineUI(cx, cy, this.cellSize, this.cellSize, '#ff6b35', 2);
                    canvas.resetAlpha();
                } else {
                    canvas.drawRectUI(cx, cy, this.cellSize, this.cellSize, 'rgba(255,255,255,0.05)');
                    canvas.drawRectOutlineUI(cx, cy, this.cellSize, this.cellSize, 'rgba(255,255,255,0.08)', 1);
                }

                // Cryptid indicator
                const centerX = cx + this.cellSize / 2;
                const centerY = cy + this.cellSize / 2 - 2;

                if (isCaught) {
                    // Colored circle with sprite color
                    canvas.drawCircleUI(centerX, centerY, 14, cryptid.spriteColor || '#888');
                } else if (isSeen) {
                    // Dark outline only (seen but not caught)
                    canvas.drawCircleUI(centerX, centerY, 14, 'rgba(0,0,0,0.3)');
                    canvas.drawRectOutlineUI(centerX - 14, centerY - 14, 28, 28, 'rgba(255,255,255,0.2)', 1);
                } else {
                    // Gray circle (unseen)
                    canvas.drawCircleUI(centerX, centerY, 14, 'rgba(60,60,60,0.5)');
                }

                // Number label
                const numColor = isCaught ? '#fff' : (isSeen ? '#777' : '#444');
                canvas.drawText(String(idx + 1), centerX, cy + this.cellSize - 8, numColor, 8, 'center');
            }
        }

        // Scroll indicators
        if (this.scrollRow > 0) {
            canvas.drawTextShadow('^', SCREEN_W / 2, this.gridY - 8, '#aaa', 12, 'center');
        }
        if (endRow < this.totalRows) {
            const bottomY = this.gridY + this.visibleRows * (this.cellSize + this.cellPadding) - 4;
            canvas.drawTextShadow('v', SCREEN_W / 2, bottomY, '#aaa', 12, 'center');
        }

        // Info bar for selected cryptid
        const selected = this.allCryptids[this.cursorIndex];
        if (selected) {
            const infoY = SCREEN_H - 40;
            canvas.drawRectUI(20, infoY, SCREEN_W - 40, 22, 'rgba(0,0,0,0.5)');
            if (this.caughtSet.has(selected.id)) {
                canvas.drawText(`#${this.cursorIndex + 1} ${selected.name}`, 30, infoY + 4, COLORS.white, 11);
                if (selected.types) {
                    const typeStr = selected.types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' / ');
                    canvas.drawText(typeStr, SCREEN_W - 30, infoY + 4, '#aaa', 10, 'right');
                }
            } else if (this.seenSet.has(selected.id)) {
                canvas.drawText(`#${this.cursorIndex + 1} ${selected.name}`, 30, infoY + 4, '#888', 11);
                canvas.drawText('Not caught', SCREEN_W - 30, infoY + 4, '#666', 10, 'right');
            } else {
                canvas.drawText(`#${this.cursorIndex + 1} ???`, 30, infoY + 4, '#555', 11);
            }
        }
    }

    renderDetail(canvas) {
        const cryptid = this.allCryptids[this.cursorIndex];
        if (!cryptid) return;

        const panelX = 30;
        const panelY = 42;
        const panelW = SCREEN_W - 60;
        const panelH = SCREEN_H - 80;

        canvas.drawRectUI(panelX, panelY, panelW, panelH, 'rgba(10,10,35,0.95)');
        canvas.drawRectOutlineUI(panelX, panelY, panelW, panelH, '#ff6b35', 2);

        // Entry number and name
        canvas.drawTextShadow(
            `#${this.cursorIndex + 1}  ${cryptid.name}`,
            panelX + panelW / 2, panelY + 10, '#ff6b35', 18, 'center'
        );

        // Sprite
        const spriteX = panelX + 70;
        const spriteY = panelY + 70;
        canvas.drawRectUI(spriteX - 30, spriteY - 30, 60, 60, 'rgba(0,0,0,0.3)');
        canvas.drawCryptidSprite(spriteX, spriteY, 28, cryptid.spriteColor || '#888', null);

        // Types
        const types = cryptid.types || [];
        for (let t = 0; t < types.length; t++) {
            const tc = TYPE_COLORS[types[t]] || '#888';
            const bx = spriteX + 50 + t * 60;
            const by = panelY + 40;
            canvas.drawRectUI(bx, by, 52, 16, tc);
            canvas.drawText(
                types[t].charAt(0).toUpperCase() + types[t].slice(1),
                bx + 26, by + 2, '#fff', 9, 'center'
            );
        }

        // Region
        if (cryptid.region) {
            canvas.drawText(`Region: ${cryptid.region}`, spriteX + 50, panelY + 64, '#aaa', 10);
        }

        // Description
        if (cryptid.description) {
            const descX = panelX + 16;
            const descY = panelY + 108;
            const maxWidth = panelW - 32;
            // Simple word wrap
            const words = cryptid.description.split(' ');
            let line = '';
            let lineY = descY;
            for (const word of words) {
                const testLine = line ? line + ' ' + word : word;
                if (testLine.length > 50 && line) {
                    canvas.drawText(line, descX, lineY, '#ccc', 10);
                    line = word;
                    lineY += 14;
                } else {
                    line = testLine;
                }
            }
            if (line) {
                canvas.drawText(line, descX, lineY, '#ccc', 10);
            }
        }

        // Base stats as bars
        const stats = cryptid.baseStats || {};
        const statNames = ['hp', 'atk', 'def', 'spAtk', 'spDef', 'spd'];
        const statLabels = { hp: 'HP', atk: 'ATK', def: 'DEF', spAtk: 'SP.A', spDef: 'SP.D', spd: 'SPD' };
        const maxStatVal = 150;
        const statStartY = panelY + 150;
        const barX = panelX + 60;
        const barW = panelW - 120;

        for (let i = 0; i < statNames.length; i++) {
            const sy = statStartY + i * 18;
            const stat = statNames[i];
            const val = stats[stat] || 0;
            const ratio = Math.min(1, val / maxStatVal);

            canvas.drawText(statLabels[stat], panelX + 14, sy, '#aaa', 10);
            canvas.drawRectUI(barX, sy + 2, barW, 10, 'rgba(0,0,0,0.4)');
            canvas.drawRectUI(barX, sy + 2, barW * ratio, 10, this.getStatBarColor(ratio));
            canvas.drawText(String(val), barX + barW + 8, sy, '#fff', 10);
        }
    }

    getStatBarColor(ratio) {
        if (ratio > 0.7) return '#4caf50';
        if (ratio > 0.4) return '#ff9800';
        return '#f44336';
    }
}
