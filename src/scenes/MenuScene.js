import { SCREEN_W, SCREEN_H, COLORS, TYPE_COLORS } from '../utils/constants.js';
import { getItem } from '../data/items.js';

export class MenuScene {
    constructor(player, questSystem) {
        this.game = null;
        this.canvas = null;
        this.input = null;
        this.player = player;
        this.questSystem = questSystem;

        this.tabs = ['Party', 'Bag', 'Cryptidex', 'Journal', 'Save'];
        this.tabIndex = 0;
        this.listIndex = 0;
        this.viewingDetail = false;
        this.saveSlotIndex = 0;
        this.saveMessage = null;
        this.saveMessageTimer = 0;

        // Bag grouping
        this.bagGroups = ['trap', 'potion', 'status_heal', 'battle', 'evolution', 'key'];
        this.bagGroupNames = { trap: 'Traps', potion: 'Potions', status_heal: 'Status Heals', battle: 'Battle', evolution: 'Evolution', key: 'Key Items' };

        // Navigation debounce
        this._prevLeft = false;
        this._prevRight = false;
        this._prevUp = false;
        this._prevDown = false;

        this.timer = 0;
    }

    enter() {
        this.tabIndex = 0;
        this.listIndex = 0;
        this.viewingDetail = false;
        this.saveSlotIndex = 0;
        this.saveMessage = null;
        this.timer = 0;
    }

    exit() {}
    resume() {}

    update(dt) {
        this.timer += dt;

        if (this.saveMessageTimer > 0) {
            this.saveMessageTimer -= dt;
            if (this.saveMessageTimer <= 0) {
                this.saveMessage = null;
            }
        }

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
            // In detail view, only cancel exits
            return;
        }

        // Tab navigation with left/right
        if (leftPressed && !this._prevLeft) {
            this.tabIndex = (this.tabIndex - 1 + this.tabs.length) % this.tabs.length;
            this.listIndex = 0;
        }
        if (rightPressed && !this._prevRight) {
            this.tabIndex = (this.tabIndex + 1) % this.tabs.length;
            this.listIndex = 0;
        }

        // List navigation with up/down
        const listLen = this.getListLength();
        if (upPressed && !this._prevUp) {
            this.listIndex = (this.listIndex - 1 + Math.max(1, listLen)) % Math.max(1, listLen);
        }
        if (downPressed && !this._prevDown) {
            this.listIndex = (this.listIndex + 1) % Math.max(1, listLen);
        }

        this._prevLeft = leftPressed;
        this._prevRight = rightPressed;
        this._prevUp = upPressed;
        this._prevDown = downPressed;

        // Action button
        if (this.input.actionJustPressed) {
            this.handleAction();
        }
    }

    getListLength() {
        const tab = this.tabs[this.tabIndex];
        if (tab === 'Party') return this.player.party.length;
        if (tab === 'Bag') return this.getBagItems().length;
        if (tab === 'Cryptidex') return 1;
        if (tab === 'Journal') return this.questSystem.getActiveQuests().length;
        if (tab === 'Save') return 3;
        return 0;
    }

    getBagItems() {
        const items = [];
        for (const [itemId, count] of Object.entries(this.player.inventory)) {
            if (count > 0) {
                const itemData = getItem(itemId);
                items.push({ id: itemId, count, data: itemData });
            }
        }
        // Sort by type group order
        items.sort((a, b) => {
            const ai = this.bagGroups.indexOf(a.data?.type);
            const bi = this.bagGroups.indexOf(b.data?.type);
            return ai - bi;
        });
        return items;
    }

    handleAction() {
        const tab = this.tabs[this.tabIndex];
        if (tab === 'Party') {
            if (this.player.party.length > 0 && this.listIndex < this.player.party.length) {
                this.viewingDetail = true;
            }
        } else if (tab === 'Cryptidex') {
            // Signal game to push CryptidexScene
            if (this.game.onOpenCryptidex) {
                this.game.onOpenCryptidex();
            }
        } else if (tab === 'Save') {
            this.saveToSlot(this.listIndex);
        }
    }

    saveToSlot(slot) {
        const gs = this.game.globalState;
        const saveData = {
            playerName: gs.playerName || 'Player',
            playTime: gs.playTime || 0,
            gold: gs.gold,
            badges: gs.badges || [],
            currentRegion: gs.currentRegion,
            playerX: this.player.tileX,
            playerY: this.player.tileY,
            party: this.player.party,
            inventory: this.player.inventory,
            questStates: gs.questStates,
            cryptidexSeen: gs.cryptidexSeen,
            cryptidexCaught: gs.cryptidexCaught,
            flags: gs.flags,
            pcBox: this.player.pcBox,
        };
        const success = this.game.save.save(slot, saveData);
        this.saveMessage = success ? 'Game saved!' : 'Save failed!';
        this.saveMessageTimer = 2000;
    }

    render(canvas) {
        // Semi-transparent overlay
        canvas.drawRectUI(0, 0, SCREEN_W, SCREEN_H, 'rgba(0,0,0,0.75)');

        // Menu panel
        const panelX = 20;
        const panelY = 16;
        const panelW = SCREEN_W - 40;
        const panelH = SCREEN_H - 32;
        canvas.drawRectUI(panelX, panelY, panelW, panelH, 'rgba(10,10,35,0.95)');
        canvas.drawRectOutlineUI(panelX, panelY, panelW, panelH, '#ff6b35', 2);

        // Tabs
        this.renderTabs(canvas, panelX, panelY, panelW);

        // Content area
        const contentY = panelY + 34;
        const contentH = panelH - 44;

        const tab = this.tabs[this.tabIndex];
        if (tab === 'Party') {
            this.renderPartyTab(canvas, panelX + 8, contentY, panelW - 16, contentH);
        } else if (tab === 'Bag') {
            this.renderBagTab(canvas, panelX + 8, contentY, panelW - 16, contentH);
        } else if (tab === 'Cryptidex') {
            this.renderCryptidexTab(canvas, panelX + 8, contentY, panelW - 16, contentH);
        } else if (tab === 'Journal') {
            this.renderJournalTab(canvas, panelX + 8, contentY, panelW - 16, contentH);
        } else if (tab === 'Save') {
            this.renderSaveTab(canvas, panelX + 8, contentY, panelW - 16, contentH);
        }

        // Controls hint
        canvas.drawText('L/R: Tab   Up/Down: Navigate   A: Select   B: Back', SCREEN_W / 2, SCREEN_H - 10, '#555', 9, 'center');

        // Save notification
        if (this.saveMessage) {
            const alpha = Math.min(1, this.saveMessageTimer / 500);
            canvas.setAlpha(alpha);
            canvas.drawRectUI(SCREEN_W / 2 - 80, SCREEN_H / 2 - 16, 160, 32, 'rgba(0,0,0,0.9)');
            canvas.drawRectOutlineUI(SCREEN_W / 2 - 80, SCREEN_H / 2 - 16, 160, 32, '#4caf50', 2);
            canvas.drawTextShadow(this.saveMessage, SCREEN_W / 2, SCREEN_H / 2 - 6, '#fff', 14, 'center');
            canvas.resetAlpha();
        }
    }

    renderTabs(canvas, panelX, panelY, panelW) {
        const tabW = panelW / this.tabs.length;
        for (let i = 0; i < this.tabs.length; i++) {
            const tx = panelX + i * tabW;
            const ty = panelY + 2;
            const isActive = i === this.tabIndex;

            if (isActive) {
                canvas.drawRectUI(tx + 2, ty, tabW - 4, 28, 'rgba(255,107,53,0.3)');
                canvas.drawTextShadow(this.tabs[i], tx + tabW / 2, ty + 7, '#ff6b35', 12, 'center');
            } else {
                canvas.drawText(this.tabs[i], tx + tabW / 2, ty + 7, '#777', 11, 'center');
            }
        }
        // Tab divider line
        canvas.drawRectUI(panelX, panelY + 30, panelW, 1, 'rgba(255,255,255,0.15)');
    }

    renderPartyTab(canvas, x, y, w, h) {
        if (this.viewingDetail) {
            this.renderPartyDetail(canvas, x, y, w, h);
            return;
        }

        const party = this.player.party;
        if (party.length === 0) {
            canvas.drawText('No cryptids in party.', x + w / 2, y + 40, '#777', 12, 'center');
            return;
        }

        const slotH = 38;
        for (let i = 0; i < party.length; i++) {
            const c = party[i];
            const sy = y + i * (slotH + 4);
            const isSelected = i === this.listIndex;

            // Background
            if (isSelected) {
                canvas.drawRectUI(x, sy, w, slotH, 'rgba(255,107,53,0.2)');
                canvas.drawRectOutlineUI(x, sy, w, slotH, '#ff6b35', 1);
            } else {
                canvas.drawRectUI(x, sy, w, slotH, 'rgba(255,255,255,0.05)');
            }

            // Sprite circle
            canvas.drawCircleUI(x + 18, sy + slotH / 2, 12, c.spriteColor);

            // Name and level
            canvas.drawTextShadow(c.displayName, x + 38, sy + 4, COLORS.white, 12);
            canvas.drawText(`Lv.${c.level}`, x + 38 + 120, sy + 4, '#aaa', 11);

            // HP bar
            const barX = x + 38;
            const barY = sy + 22;
            const barW = 140;
            const barH = 8;
            const hpRatio = c.hpRatio;
            const hpColor = hpRatio > 0.5 ? COLORS.hp : (hpRatio > 0.25 ? COLORS.hpMid : COLORS.hpLow);
            canvas.drawRectUI(barX, barY, barW, barH, 'rgba(0,0,0,0.4)');
            canvas.drawRectUI(barX, barY, barW * hpRatio, barH, hpColor);
            canvas.drawText(`${c.hp}/${c.maxHp}`, barX + barW + 8, barY - 2, '#aaa', 9);

            // Type indicators
            const typeX = x + w - 10;
            for (let t = c.types.length - 1; t >= 0; t--) {
                const tc = TYPE_COLORS[c.types[t]] || '#888';
                canvas.drawCircleUI(typeX - t * 18, sy + slotH / 2, 6, tc);
            }

            // Status indicator
            if (c.isFainted) {
                canvas.drawText('FNT', x + w - 60, sy + 4, '#f44336', 9);
            } else if (c.status !== 'none') {
                canvas.drawText(c.status.toUpperCase().slice(0, 3), x + w - 60, sy + 4, '#ff9800', 9);
            }
        }
    }

    renderPartyDetail(canvas, x, y, w, h) {
        const c = this.player.party[this.listIndex];
        if (!c) return;

        // Header
        canvas.drawTextShadow(c.displayName, x + w / 2, y + 4, '#ff6b35', 16, 'center');
        canvas.drawText(`Level ${c.level}`, x + w / 2, y + 24, '#aaa', 11, 'center');

        // Sprite
        canvas.drawCryptidSprite(x + 60, y + 70, 36, c.spriteColor, null);

        // Types
        for (let t = 0; t < c.types.length; t++) {
            const tc = TYPE_COLORS[c.types[t]] || '#888';
            const bx = x + 110 + t * 60;
            canvas.drawRectUI(bx, y + 44, 52, 16, tc);
            canvas.drawText(c.types[t].charAt(0).toUpperCase() + c.types[t].slice(1), bx + 26, y + 46, '#fff', 9, 'center');
        }

        // HP / XP
        canvas.drawText(`HP: ${c.hp} / ${c.maxHp}`, x + 110, y + 68, COLORS.white, 11);
        canvas.drawText(`XP: ${c.xp} / ${c.xpToNext}`, x + 110, y + 84, COLORS.xp, 11);

        // Stats as bars
        const stats = ['hp', 'atk', 'def', 'spAtk', 'spDef', 'spd'];
        const statLabels = { hp: 'HP', atk: 'ATK', def: 'DEF', spAtk: 'SP.A', spDef: 'SP.D', spd: 'SPD' };
        const maxStatVal = 200;

        const statStartY = y + 110;
        for (let i = 0; i < stats.length; i++) {
            const sy = statStartY + i * 20;
            const stat = stats[i];
            const val = c.stats[stat];
            const ratio = Math.min(1, val / maxStatVal);

            canvas.drawText(statLabels[stat], x + 6, sy, '#aaa', 10);
            canvas.drawRectUI(x + 50, sy + 2, 180, 10, 'rgba(0,0,0,0.4)');
            canvas.drawRectUI(x + 50, sy + 2, 180 * ratio, 10, this.getStatBarColor(ratio));
            canvas.drawText(String(val), x + 240, sy, '#fff', 10);
        }

        // Moves
        const moveStartX = x + w / 2 + 20;
        canvas.drawText('Moves:', moveStartX, statStartY, '#aaa', 10);
        for (let i = 0; i < c.moves.length; i++) {
            const my = statStartY + 16 + i * 18;
            canvas.drawText(`${c.moves[i]}`, moveStartX + 4, my, '#fff', 10);
            canvas.drawText(`${c.pp[i]}/${c.maxPp[i]}`, moveStartX + 130, my, '#888', 9);
        }

        canvas.drawText('Press B to go back', x + w / 2, y + h - 10, '#555', 9, 'center');
    }

    getStatBarColor(ratio) {
        if (ratio > 0.7) return '#4caf50';
        if (ratio > 0.4) return '#ff9800';
        return '#f44336';
    }

    renderBagTab(canvas, x, y, w, h) {
        const items = this.getBagItems();
        if (items.length === 0) {
            canvas.drawText('Bag is empty.', x + w / 2, y + 40, '#777', 12, 'center');
            return;
        }

        let currentGroup = null;
        const slotH = 22;
        const maxVisible = Math.floor(h / (slotH + 2));
        const scrollOffset = Math.max(0, this.listIndex - maxVisible + 3);

        let drawIdx = 0;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const group = item.data?.type || 'misc';

            if (group !== currentGroup) {
                currentGroup = group;
                if (drawIdx >= scrollOffset && (drawIdx - scrollOffset) * (slotH + 2) < h - 30) {
                    const gy = y + (drawIdx - scrollOffset) * (slotH + 2);
                    canvas.drawText(this.bagGroupNames[group] || 'Other', x + 4, gy, '#ff6b35', 10);
                }
                drawIdx++;
            }

            if (drawIdx >= scrollOffset && (drawIdx - scrollOffset) * (slotH + 2) < h - 30) {
                const iy = y + (drawIdx - scrollOffset) * (slotH + 2);
                const isSelected = i === this.listIndex;

                if (isSelected) {
                    canvas.drawRectUI(x, iy, w, slotH, 'rgba(255,107,53,0.2)');
                    canvas.drawRectOutlineUI(x, iy, w, slotH, '#ff6b35', 1);
                }

                canvas.drawText(item.data?.name || item.id, x + 12, iy + 4, COLORS.white, 11);
                canvas.drawText(`x${item.count}`, x + w - 50, iy + 4, '#aaa', 11);
            }
            drawIdx++;
        }

        // Item description at bottom
        if (this.listIndex < items.length) {
            const selected = items[this.listIndex];
            canvas.drawRectUI(x, y + h - 24, w, 22, 'rgba(0,0,0,0.5)');
            canvas.drawText(selected.data?.description || '', x + 6, y + h - 20, '#bbb', 9);
        }
    }

    renderCryptidexTab(canvas, x, y, w, h) {
        const gs = this.game.globalState;
        const seenCount = gs.cryptidexSeen?.size || 0;
        const caughtCount = gs.cryptidexCaught?.size || 0;

        canvas.drawTextShadow('Cryptidex', x + w / 2, y + 20, '#ff6b35', 18, 'center');

        // Caught / Seen counts
        canvas.drawRectUI(x + w / 2 - 100, y + 50, 200, 50, 'rgba(255,255,255,0.05)');
        canvas.drawRectOutlineUI(x + w / 2 - 100, y + 50, 200, 50, 'rgba(255,255,255,0.15)', 1);

        canvas.drawText('Seen:', x + w / 2 - 70, y + 60, '#aaa', 12);
        canvas.drawTextShadow(String(seenCount), x + w / 2 - 10, y + 60, COLORS.white, 14);
        canvas.drawText('/ 76', x + w / 2 + 16, y + 60, '#666', 12);

        canvas.drawText('Caught:', x + w / 2 - 70, y + 80, '#aaa', 12);
        canvas.drawTextShadow(String(caughtCount), x + w / 2 - 10, y + 80, '#4caf50', 14);
        canvas.drawText('/ 76', x + w / 2 + 16, y + 80, '#666', 12);

        // Completion bar
        const barX = x + w / 2 - 80;
        const barY = y + 115;
        const barW = 160;
        const barH = 10;
        const ratio = caughtCount / 76;
        canvas.drawRectUI(barX, barY, barW, barH, 'rgba(0,0,0,0.4)');
        canvas.drawRectUI(barX, barY, barW * ratio, barH, '#4caf50');
        canvas.drawText(`${Math.floor(ratio * 100)}%`, barX + barW + 10, barY - 1, '#aaa', 10);

        // Open prompt
        const pulse = Math.sin(this.timer / 300) * 0.3 + 0.7;
        canvas.setAlpha(pulse);
        canvas.drawTextShadow('Press A to open Cryptidex', x + w / 2, y + 155, '#ff6b35', 12, 'center');
        canvas.resetAlpha();
    }

    renderJournalTab(canvas, x, y, w, h) {
        const quests = this.questSystem.getActiveQuests();
        if (quests.length === 0) {
            canvas.drawText('No active quests.', x + w / 2, y + 40, '#777', 12, 'center');
            return;
        }

        const slotH = 58;
        const maxVisible = Math.floor(h / (slotH + 4));
        const scrollOffset = Math.max(0, this.listIndex - maxVisible + 1);

        for (let i = 0; i < quests.length; i++) {
            if (i < scrollOffset || (i - scrollOffset) >= maxVisible) continue;

            const quest = quests[i];
            const qy = y + (i - scrollOffset) * (slotH + 4);
            const isSelected = i === this.listIndex;

            if (isSelected) {
                canvas.drawRectUI(x, qy, w, slotH, 'rgba(255,107,53,0.15)');
                canvas.drawRectOutlineUI(x, qy, w, slotH, '#ff6b35', 1);
            } else {
                canvas.drawRectUI(x, qy, w, slotH, 'rgba(255,255,255,0.03)');
            }

            // Quest name
            canvas.drawTextShadow(quest.name, x + 8, qy + 4, '#ffd700', 12);

            // Description
            canvas.drawText(quest.description || '', x + 8, qy + 20, '#bbb', 9);

            // Objectives progress
            if (quest.objectives) {
                for (let o = 0; o < quest.objectives.length; o++) {
                    const obj = quest.objectives[o];
                    const oy = qy + 34 + o * 12;
                    const check = obj.completed ? '[x]' : '[ ]';
                    const color = obj.completed ? '#4caf50' : '#aaa';
                    let progressText = obj.description || obj.type;
                    if (obj.count) {
                        progressText += ` (${obj.current || 0}/${obj.count})`;
                    }
                    canvas.drawText(`${check} ${progressText}`, x + 16, oy, color, 9);
                }
            }
        }
    }

    renderSaveTab(canvas, x, y, w, h) {
        canvas.drawTextShadow('Save Game', x + w / 2, y + 4, '#ff6b35', 16, 'center');

        for (let i = 0; i < 3; i++) {
            const sy = y + 30 + i * 62;
            const isSelected = i === this.listIndex;
            const slotInfo = this.game.save.slots[i];

            if (isSelected) {
                canvas.drawRectUI(x, sy, w, 54, 'rgba(255,107,53,0.2)');
                canvas.drawRectOutlineUI(x, sy, w, 54, '#ff6b35', 1);
            } else {
                canvas.drawRectUI(x, sy, w, 54, 'rgba(255,255,255,0.05)');
                canvas.drawRectOutlineUI(x, sy, w, 54, 'rgba(255,255,255,0.1)', 1);
            }

            canvas.drawTextShadow(`Slot ${i + 1}`, x + 12, sy + 6, COLORS.white, 13);

            if (slotInfo) {
                canvas.drawText(slotInfo.playerName || 'Player', x + 80, sy + 6, '#aaa', 11);
                canvas.drawText(`Region: ${slotInfo.region || '???'}`, x + 12, sy + 24, '#888', 10);
                canvas.drawText(`Caught: ${slotInfo.caught || 0}`, x + 180, sy + 24, '#888', 10);
                const timeStr = this.game.save.formatPlayTime(slotInfo.playTime || 0);
                canvas.drawText(`Time: ${timeStr}`, x + 12, sy + 38, '#666', 9);
                if (slotInfo.timestamp) {
                    const date = new Date(slotInfo.timestamp);
                    canvas.drawText(date.toLocaleDateString(), x + 180, sy + 38, '#666', 9);
                }
            } else {
                canvas.drawText('- Empty -', x + w / 2, sy + 24, '#555', 11, 'center');
            }
        }
    }
}
