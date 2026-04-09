import { SCREEN_W, SCREEN_H, TILE_SIZE, COLORS, TYPE_COLORS } from '../utils/constants.js';
import { Player } from '../entities/Player.js';
import { TileRenderer, getTheme } from '../ui/TileRenderer.js';
import { AmbientEffects } from '../ui/AmbientEffects.js';

export class OverworldScene {
    constructor(mapData, mapMeta, npcs, regionId, encounterSystem, questSystem, player) {
        this.game = null;
        this.canvas = null;
        this.input = null;
        this.map = mapData;
        this.mapMeta = mapMeta;
        this.npcs = npcs || [];
        this.regionId = regionId;
        this.encounterSystem = encounterSystem;
        this.questSystem = questSystem;
        this.player = player;
        this.rows = mapData.length;
        this.cols = mapData[0].length;
        this.notification = null;
        this.notificationTimer = 0;
        this.dialogueActive = false;
        this.dialogueText = [];
        this.dialogueIndex = 0;
        this.dialogueCallback = null;
        this.interactingNpc = null;

        // New rendering systems
        this.theme = getTheme(regionId);
        this.tileRenderer = new TileRenderer(this.theme);
        this.ambient = new AmbientEffects(this.theme.ambient);
        this.time = 0;
        this.footstepParticles = [];
    }

    enter() {
        this.showNotification(this.mapMeta?.name || this.regionId, 2000);
    }

    exit() {}
    resume() {
        // Returning from battle/menu
    }

    showNotification(text, duration = 2000) {
        this.notification = text;
        this.notificationTimer = duration;
    }

    showDialogue(lines, callback) {
        this.dialogueActive = true;
        this.dialogueText = Array.isArray(lines) ? lines : [lines];
        this.dialogueIndex = 0;
        this.dialogueCallback = callback;
    }

    isCollision(tileX, tileY) {
        if (tileX < 0 || tileY < 0 || tileX >= this.cols || tileY >= this.rows) return true;
        const tile = this.map[tileY][tileX];
        if (tile === 1 || tile === 3) return true; // trees, water

        // NPC collision
        for (const npc of this.npcs) {
            if (npc.x === tileX && npc.y === tileY) return true;
        }

        return false;
    }

    getFacingTile() {
        const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
        const [dx, dy] = dirs[this.player.direction];
        return { x: this.player.tileX + dx, y: this.player.tileY + dy };
    }

    getNpcAt(x, y) {
        return this.npcs.find(n => n.x === x && n.y === y);
    }

    update(dt) {
        this.time += dt;
        this.tileRenderer.setTime(this.time);
        this.ambient.update(dt);

        // Update footstep particles
        for (let i = this.footstepParticles.length - 1; i >= 0; i--) {
            const fp = this.footstepParticles[i];
            fp.age += dt;
            fp.alpha = Math.max(0, 1 - fp.age / fp.life);
            fp.y -= dt * 0.02;
            if (fp.age > fp.life) this.footstepParticles.splice(i, 1);
        }

        // Handle dialogue
        if (this.dialogueActive) {
            if (this.input.actionJustPressed) {
                this.dialogueIndex++;
                if (this.dialogueIndex >= this.dialogueText.length) {
                    this.dialogueActive = false;
                    if (this.dialogueCallback) {
                        this.dialogueCallback();
                        this.dialogueCallback = null;
                    }
                }
            }
            return;
        }

        // Menu
        if (this.input.menuJustPressed) {
            if (this.game.onOpenMenu) {
                this.game.onOpenMenu();
            }
            return;
        }

        // Interaction
        if (this.input.actionJustPressed && !this.player.moving) {
            const facing = this.getFacingTile();
            const npc = this.getNpcAt(facing.x, facing.y);
            if (npc) {
                this.handleNpcInteraction(npc);
                return;
            }

            // Check for sign
            if (facing.y >= 0 && facing.y < this.rows && facing.x >= 0 && facing.x < this.cols) {
                const tile = this.map[facing.y][facing.x];
                if (tile === 6) {
                    this.showDialogue(['A weathered signpost...']);
                }
            }
        }

        // Player movement
        const wasMoving = this.player.moving;
        this.player.update(dt, this.input, (tx, ty) => this.isCollision(tx, ty));

        // Check tile events when landing on new tile
        if (wasMoving && !this.player.moving) {
            this.onPlayerStep();
        }

        // Update camera
        this.canvas.camera.x = this.player.x - SCREEN_W / 2 + TILE_SIZE / 2;
        this.canvas.camera.y = this.player.y - SCREEN_H / 2 + TILE_SIZE / 2;

        // Clamp camera
        this.canvas.camera.x = Math.max(0, Math.min(this.canvas.camera.x, this.cols * TILE_SIZE - SCREEN_W));
        this.canvas.camera.y = Math.max(0, Math.min(this.canvas.camera.y, this.rows * TILE_SIZE - SCREEN_H));

        // Notification timer
        if (this.notificationTimer > 0) {
            this.notificationTimer -= dt;
        }
    }

    onPlayerStep() {
        const tile = this.map[this.player.tileY]?.[this.player.tileX];

        // Spawn a footstep puff
        const px = this.player.x + TILE_SIZE / 2;
        const py = this.player.y + TILE_SIZE - 2;
        for (let i = 0; i < 3; i++) {
            this.footstepParticles.push({
                x: px + (Math.random() - 0.5) * 10,
                y: py + (Math.random() - 0.5) * 3,
                age: 0, life: 400, alpha: 1,
                size: 1 + Math.random() * 2,
            });
        }

        // Wild encounter check
        if (tile === 2) {
            const wild = this.encounterSystem.checkEncounter(this.regionId, tile);
            if (wild) {
                // Mark as seen in cryptidex
                this.game.globalState.cryptidexSeen.add(wild.templateId);
                if (this.game.onWildEncounter) {
                    this.game.onWildEncounter(wild);
                }
                return;
            }
        }

        // Zone exit
        if (tile === 8) {
            if (this.game.onZoneExit) {
                this.game.onZoneExit(this.regionId);
            }
        }

        // Quest location objectives
        if (this.questSystem) {
            this.questSystem.updateObjective('reach_location', this.regionId);
        }
    }

    handleNpcInteraction(npc) {
        this.interactingNpc = npc;

        if (npc.role === 'healer') {
            this.showDialogue(npc.dialogue || ['Let me heal your Cryptids!'], () => {
                this.player.healAll();
                this.showNotification('All Cryptids healed!', 1500);
                this.questSystem?.updateObjective('talk', npc.id);
            });
        } else if (npc.role === 'shopkeeper') {
            this.showDialogue(npc.dialogue || ['Welcome to my shop!'], () => {
                if (this.game.onOpenShop) {
                    this.game.onOpenShop(npc);
                }
            });
        } else if (npc.role === 'trainer' || npc.role === 'boss') {
            const defeated = this.game.globalState.flags[`defeated_${npc.id}`];
            if (defeated) {
                this.showDialogue([npc.defeatDialogue || 'You already proved yourself.']);
            } else {
                this.showDialogue(npc.dialogue || ['Prepare to battle!'], () => {
                    if (this.game.onTrainerBattle) {
                        this.game.onTrainerBattle(npc);
                    }
                });
            }
        } else if (npc.role === 'professor') {
            if (!this.game.globalState.flags.got_starter) {
                this.showDialogue(npc.dialogue || ['Welcome!'], () => {
                    if (this.game.onStarterSelect) {
                        this.game.onStarterSelect(npc);
                    }
                });
            } else {
                this.showDialogue(['How is your Cryptid journey going? Keep exploring!']);
            }
        } else if (npc.role === 'questgiver') {
            this.handleQuestNpc(npc);
        } else {
            this.showDialogue(npc.dialogue || ['...']);
            this.questSystem?.updateObjective('talk', npc.id);
        }
    }

    handleQuestNpc(npc) {
        if (npc.questId) {
            const quest = this.questSystem?.allQuests.find(q => q.id === npc.questId);
            if (!quest) {
                this.showDialogue(npc.dialogue || ['...']);
                return;
            }

            const state = this.game.globalState.questStates[npc.questId];
            if (!state) {
                // Offer quest
                this.showDialogue(npc.dialogue || [`I have a task for you: ${quest.name}`], () => {
                    this.questSystem.startQuest(npc.questId);
                    this.showNotification(`Quest started: ${quest.name}`, 2000);
                });
            } else if (state === 'active') {
                // Check if ready to complete
                if (quest.objectives.every(o => o.completed)) {
                    this.showDialogue([`You've completed "${quest.name}"! Here's your reward.`], () => {
                        const rewards = this.questSystem.completeQuest(npc.questId);
                        if (rewards) {
                            this.game.globalState.gold += rewards.gold || 0;
                            if (rewards.items) {
                                for (const item of rewards.items) {
                                    this.player.addItem(item);
                                }
                            }
                            this.showNotification(`Quest complete! +${rewards.gold}G`, 2000);
                        }
                    });
                } else {
                    this.showDialogue(npc.activeDialogue || ['Still working on that task?']);
                }
            } else {
                this.showDialogue(npc.completeDialogue || ['Thanks for your help!']);
            }
        } else {
            this.showDialogue(npc.dialogue || ['...']);
        }
    }

    render(canvas) {
        const ctx = canvas.ctx;
        const startCol = Math.max(0, Math.floor(canvas.camera.x / TILE_SIZE) - 1);
        const endCol = Math.min(this.cols, startCol + Math.ceil(SCREEN_W / TILE_SIZE) + 3);
        const startRow = Math.max(0, Math.floor(canvas.camera.y / TILE_SIZE) - 1);
        const endRow = Math.min(this.rows, startRow + Math.ceil(SCREEN_H / TILE_SIZE) + 3);

        // Sky/backdrop fill
        ctx.fillStyle = this.theme.grassLo;
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

        const camX = canvas.camera.x - canvas.shake.x;
        const camY = canvas.camera.y - canvas.shake.y;

        // Draw tiles using the rich TileRenderer
        for (let y = startRow; y < endRow; y++) {
            for (let x = startCol; x < endCol; x++) {
                const tile = this.map[y][x];
                const sx = Math.floor(x * TILE_SIZE - camX);
                const sy = Math.floor(y * TILE_SIZE - camY);
                this.tileRenderer.drawTile(ctx, tile, x, y, sx, sy);
            }
        }

        // Atmospheric color wash
        if (this.theme.lightTint) {
            ctx.fillStyle = this.theme.lightTint;
            ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
        }

        // Footstep puffs behind player
        for (const fp of this.footstepParticles) {
            ctx.globalAlpha = fp.alpha * 0.5;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(fp.x - camX, fp.y - camY, fp.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Draw NPCs (sorted by y for simple depth)
        const visibleNpcs = this.npcs.filter(n => n.x >= startCol && n.x < endCol && n.y >= startRow && n.y < endRow);
        const sortedNpcs = [...visibleNpcs].sort((a, b) => a.y - b.y);
        for (const npc of sortedNpcs) {
            this.renderNpc(canvas, npc);
        }

        // Draw player
        this.player.render(canvas);

        // Draw tall grass overlay in front of player feet (depth illusion)
        for (let y = startRow; y < endRow; y++) {
            for (let x = startCol; x < endCol; x++) {
                if (this.map[y][x] === 2) {
                    const sx = Math.floor(x * TILE_SIZE - camX);
                    const sy = Math.floor(y * TILE_SIZE - camY);
                    const sway = Math.sin(this.time * 0.003 + (x + y) * 0.7) * 1.5;
                    ctx.fillStyle = 'rgba(30, 70, 20, 0.7)';
                    ctx.fillRect(sx + 6 + sway, sy + 22, 2, 8);
                    ctx.fillRect(sx + 18 + sway, sy + 24, 2, 7);
                    ctx.fillRect(sx + 26 + sway, sy + 21, 2, 9);
                }
            }
        }

        // Ambient particles (foreground atmosphere)
        this.ambient.render(ctx);

        // Vignette for focus
        this.ambient.renderVignette(ctx);

        // HUD
        this.renderHUD(canvas);

        // Dialogue box
        if (this.dialogueActive) {
            this.renderDialogue(canvas);
        }

        // Notification
        if (this.notificationTimer > 0) {
            this.renderNotification(canvas);
        }
    }

    renderNpc(canvas, npc) {
        const ctx = canvas.ctx;
        const dx = npc.x * TILE_SIZE - canvas.camera.x + canvas.shake.x;
        const dy = npc.y * TILE_SIZE - canvas.camera.y + canvas.shake.y;
        const cx = dx + TILE_SIZE / 2;

        // Idle bob
        const bob = Math.sin(this.time * 0.003 + (npc.x + npc.y)) * 1;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx, dy + TILE_SIZE - 2, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Role-specific clothing color
        const roleColors = {
            healer: '#f48fb1',
            shopkeeper: '#c8a238',
            trainer: '#c83838',
            boss: '#881122',
            professor: '#3a5a8a',
            questgiver: '#3a8a48',
            default: '#c84848',
        };
        const bodyColor = npc.sprite || roleColors[npc.role] || roleColors.default;
        const bodyDark = this.shadeHex(bodyColor, -30);

        // Body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(dx + 7, dy + 15 + bob, TILE_SIZE - 14, 14);
        // Shoulder shadow
        ctx.fillStyle = bodyDark;
        ctx.fillRect(dx + 7, dy + 27 + bob, TILE_SIZE - 14, 2);
        // Legs
        ctx.fillStyle = '#2a2018';
        ctx.fillRect(dx + 10, dy + 29, 4, 3);
        ctx.fillRect(dx + 18, dy + 29, 4, 3);

        // Head
        ctx.fillStyle = '#f5cba7';
        ctx.beginPath();
        ctx.arc(cx, dy + 9 + bob, 7, 0, Math.PI * 2);
        ctx.fill();
        // Hair
        ctx.fillStyle = npc.role === 'professor' ? '#e0e0e0' : '#3a2010';
        ctx.beginPath();
        ctx.arc(cx, dy + 6 + bob, 7, Math.PI, 0);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#111';
        ctx.fillRect(cx - 3, dy + 9 + bob, 1, 2);
        ctx.fillRect(cx + 2, dy + 9 + bob, 1, 2);

        // Role icon above NPC
        const icons = {
            healer: { color: '#ff69b4', symbol: '+' },
            shopkeeper: { color: '#ffd700', symbol: '$' },
            trainer: { color: '#ff4444', symbol: '*' },
            boss: { color: '#ff0000', symbol: '*' },
            professor: { color: '#4488cc', symbol: '?' },
            questgiver: { color: '#44ff44', symbol: '!' },
        };
        const icon = icons[npc.role];
        if (icon) {
            const py = dy - 6 + Math.sin(this.time * 0.004) * 2;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.arc(cx, py, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = icon.color;
            ctx.beginPath();
            ctx.arc(cx, py, 5, 0, Math.PI * 2);
            ctx.fill();
            canvas.drawText(icon.symbol, cx, py - 5, '#fff', 10, 'center');
        }

        // Exclamation mark for quest givers with available quests
        if (npc.role === 'questgiver' && npc.questId && !this.game.globalState.questStates[npc.questId]) {
            const py = dy - 18 + Math.sin(this.time * 0.008) * 2;
            canvas.drawTextShadow('!', cx, py, '#ffff00', 16, 'center');
        }
    }

    shadeHex(hex, amt) {
        if (!hex || hex[0] !== '#' || hex.length < 7) return hex;
        let r = parseInt(hex.slice(1, 3), 16) + amt;
        let g = parseInt(hex.slice(3, 5), 16) + amt;
        let b = parseInt(hex.slice(5, 7), 16) + amt;
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        return `rgb(${r},${g},${b})`;
    }

    renderHUD(canvas) {
        const ctx = canvas.ctx;

        // Top bar - gradient
        const topG = ctx.createLinearGradient(0, 0, 0, 28);
        topG.addColorStop(0, 'rgba(10, 10, 30, 0.88)');
        topG.addColorStop(1, 'rgba(10, 10, 30, 0.5)');
        ctx.fillStyle = topG;
        ctx.fillRect(0, 0, SCREEN_W, 28);
        // Top bar border
        ctx.strokeStyle = 'rgba(255, 180, 80, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 28.5);
        ctx.lineTo(SCREEN_W, 28.5);
        ctx.stroke();

        // Region name with icon
        ctx.fillStyle = '#ff9838';
        ctx.beginPath();
        ctx.arc(14, 14, 4, 0, Math.PI * 2);
        ctx.fill();
        canvas.drawTextShadow(this.mapMeta?.name || this.regionId, 24, 8, '#fff', 12);

        // Gold with coin icon
        const goldText = `${this.game.globalState.gold}G`;
        ctx.font = '11px monospace';
        const goldW = ctx.measureText(goldText).width;
        const goldX = SCREEN_W / 2 - goldW / 2;
        // Coin
        const coinPulse = 0.9 + Math.sin(this.time * 0.004) * 0.1;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(goldX - 8, 13, 5 * coinPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b8860b';
        ctx.beginPath();
        ctx.arc(goldX - 8, 13, 3 * coinPulse, 0, Math.PI * 2);
        ctx.fill();
        canvas.drawTextShadow(goldText, SCREEN_W / 2 + 4, 8, '#ffd700', 11, 'center');

        // Party cryptid orbs with HP rings
        const partyStartX = SCREEN_W - 8;
        for (let i = this.player.party.length - 1; i >= 0; i--) {
            const c = this.player.party[i];
            const ox = partyStartX - (this.player.party.length - 1 - i) * 16;
            const oy = 14;
            const hpColor = c.isFainted ? '#f44336' : (c.hpRatio > 0.5 ? '#4caf50' : (c.hpRatio > 0.25 ? '#ff9800' : '#f44336'));
            // Outer ring
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ox, oy, 6, 0, Math.PI * 2);
            ctx.stroke();
            // HP arc
            ctx.strokeStyle = hpColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(ox, oy, 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, c.hpRatio));
            ctx.stroke();
            // Center
            ctx.fillStyle = c.spriteColor || '#888';
            ctx.beginPath();
            ctx.arc(ox, oy, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Current quest hint at bottom
        const mainQuest = this.questSystem?.getCurrentMainQuest();
        if (mainQuest) {
            const obj = mainQuest.objectives.find(o => !o.completed);
            if (obj) {
                const barY = SCREEN_H - 22;
                const barG = ctx.createLinearGradient(0, barY, 0, SCREEN_H);
                barG.addColorStop(0, 'rgba(10,10,30,0.3)');
                barG.addColorStop(1, 'rgba(10,10,30,0.85)');
                ctx.fillStyle = barG;
                ctx.fillRect(0, barY, SCREEN_W, 22);
                ctx.strokeStyle = 'rgba(255, 180, 80, 0.4)';
                ctx.beginPath();
                ctx.moveTo(0, barY + 0.5);
                ctx.lineTo(SCREEN_W, barY + 0.5);
                ctx.stroke();
                // Quest marker diamond
                ctx.fillStyle = '#ffeb3b';
                ctx.save();
                ctx.translate(10, barY + 11);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-3, -3, 6, 6);
                ctx.restore();
                canvas.drawTextShadow(obj.description, 18, barY + 6, '#fff', 10);
            }
        }
    }

    renderDialogue(canvas) {
        const ctx = canvas.ctx;
        const boxH = 74;
        const boxY = SCREEN_H - boxH - 10;
        const boxX = 10;
        const boxW = SCREEN_W - 20;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(boxX + 3, boxY + 3, boxW, boxH);

        // Box background gradient
        const g = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
        g.addColorStop(0, 'rgba(18, 20, 48, 0.96)');
        g.addColorStop(1, 'rgba(8, 10, 28, 0.96)');
        ctx.fillStyle = g;
        ctx.fillRect(boxX, boxY, boxW, boxH);

        // Double-border
        ctx.strokeStyle = '#ff9838';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
        ctx.strokeStyle = 'rgba(255, 200, 120, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX + 3, boxY + 3, boxW - 6, boxH - 6);

        // Corner decorations
        ctx.fillStyle = '#ff9838';
        for (const [cx, cy] of [[boxX, boxY], [boxX + boxW, boxY], [boxX, boxY + boxH], [boxX + boxW, boxY + boxH]]) {
            ctx.fillRect(cx - 2, cy - 2, 4, 4);
        }

        // NPC name with underline
        let textY = boxY + 10;
        if (this.interactingNpc) {
            canvas.drawTextShadow(this.interactingNpc.name, boxX + 12, boxY + 8, '#ff9838', 13);
            ctx.fillStyle = 'rgba(255, 152, 56, 0.3)';
            ctx.fillRect(boxX + 12, boxY + 22, 80, 1);
            textY = boxY + 28;
        }

        // Text
        const text = this.dialogueText[this.dialogueIndex] || '';
        this.wrapText(canvas, text, boxX + 14, textY, boxW - 30, 12, '#fff');

        // Animated continue indicator
        const bounce = Math.sin(this.time * 0.006) > 0;
        if (bounce) {
            const cx = boxX + boxW - 18;
            const cy = boxY + boxH - 12;
            ctx.fillStyle = '#ff9838';
            ctx.beginPath();
            ctx.moveTo(cx - 4, cy - 3);
            ctx.lineTo(cx + 4, cy - 3);
            ctx.lineTo(cx, cy + 3);
            ctx.closePath();
            ctx.fill();
        }
    }

    wrapText(canvas, text, x, y, maxWidth, size, color) {
        const words = text.split(' ');
        let line = '';
        let lineY = y;

        for (const word of words) {
            const testLine = line + word + ' ';
            canvas.ctx.font = `${size}px monospace`;
            const metrics = canvas.ctx.measureText(testLine);
            if (metrics.width > maxWidth && line) {
                canvas.drawText(line.trim(), x, lineY, color, size);
                line = word + ' ';
                lineY += size + 4;
            } else {
                line = testLine;
            }
        }
        if (line.trim()) {
            canvas.drawText(line.trim(), x, lineY, color, size);
        }
    }

    renderNotification(canvas) {
        const ctx = canvas.ctx;
        const alpha = Math.min(1, this.notificationTimer / 500);
        const w = 220, h = 34;
        const x = SCREEN_W / 2 - w / 2;
        const y = 38;
        ctx.save();
        ctx.globalAlpha = alpha;
        // Glow
        const g = ctx.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, 'rgba(20, 24, 60, 0.95)');
        g.addColorStop(1, 'rgba(8, 12, 30, 0.95)');
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#ff9838';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        // Outer glow
        ctx.shadowColor = '#ff9838';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = 'rgba(255, 180, 80, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
        ctx.shadowBlur = 0;
        canvas.drawTextShadow(this.notification, SCREEN_W / 2, y + 11, '#fff', 13, 'center');
        ctx.restore();
    }
}
