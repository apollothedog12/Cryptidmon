import { SCREEN_W, SCREEN_H, TILE_SIZE, COLORS, TYPE_COLORS } from '../utils/constants.js';
import { Player } from '../entities/Player.js';

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

        // Tile colors
        this.tileColors = {
            0: '#4a8c3f', // grass
            1: '#2d5a27', // tree
            2: '#5ca84f', // tall grass
            3: '#3a7bd5', // water
            4: '#c4a862', // path
            5: '#8b7355', // building
            6: '#a0522d', // sign
            7: '#4a8c3f', // npc spawn (grass)
            8: '#e8d44d', // zone exit
            9: '#6b8c3f', // ledge
        };
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
        const startCol = Math.max(0, Math.floor(canvas.camera.x / TILE_SIZE) - 1);
        const endCol = Math.min(this.cols, startCol + Math.ceil(SCREEN_W / TILE_SIZE) + 3);
        const startRow = Math.max(0, Math.floor(canvas.camera.y / TILE_SIZE) - 1);
        const endRow = Math.min(this.rows, startRow + Math.ceil(SCREEN_H / TILE_SIZE) + 3);

        // Draw tiles
        for (let y = startRow; y < endRow; y++) {
            for (let x = startCol; x < endCol; x++) {
                const tile = this.map[y][x];
                const color = this.tileColors[tile] || '#333';
                canvas.drawRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, color);

                // Tall grass detail
                if (tile === 2) {
                    canvas.drawRect(x * TILE_SIZE + 4, y * TILE_SIZE + 2, 3, 12, '#3d7a2e');
                    canvas.drawRect(x * TILE_SIZE + 12, y * TILE_SIZE + 5, 3, 10, '#3d7a2e');
                    canvas.drawRect(x * TILE_SIZE + 22, y * TILE_SIZE + 3, 3, 11, '#3d7a2e');
                }

                // Water animation
                if (tile === 3) {
                    const wave = Math.sin((x + y + Date.now() / 500) * 0.5) * 2;
                    canvas.drawRect(x * TILE_SIZE + 4, y * TILE_SIZE + 10 + wave, 10, 2, 'rgba(255,255,255,0.2)');
                    canvas.drawRect(x * TILE_SIZE + 18, y * TILE_SIZE + 16 + wave, 8, 2, 'rgba(255,255,255,0.15)');
                }

                // Tree detail
                if (tile === 1) {
                    canvas.drawRect(x * TILE_SIZE + 12, y * TILE_SIZE + 18, 8, 14, '#5c3a1e');
                    canvas.drawCircle(x * TILE_SIZE + 16, y * TILE_SIZE + 12, 12, '#1a4d1a');
                    canvas.drawCircle(x * TILE_SIZE + 16, y * TILE_SIZE + 8, 10, '#2d6a2d');
                }

                // Building
                if (tile === 5) {
                    canvas.drawRect(x * TILE_SIZE + 2, y * TILE_SIZE + 6, TILE_SIZE - 4, TILE_SIZE - 6, '#6b4423');
                    canvas.drawRect(x * TILE_SIZE + 4, y * TILE_SIZE, TILE_SIZE - 8, 8, '#8b5e3c');
                    canvas.drawRect(x * TILE_SIZE + 11, y * TILE_SIZE + 16, 10, 16, '#4a3015');
                    canvas.drawRect(x * TILE_SIZE + 6, y * TILE_SIZE + 10, 6, 6, '#87ceeb');
                    canvas.drawRect(x * TILE_SIZE + 20, y * TILE_SIZE + 10, 6, 6, '#87ceeb');
                }

                // Sign
                if (tile === 6) {
                    canvas.drawRect(x * TILE_SIZE + 14, y * TILE_SIZE + 16, 4, 16, '#5c3a1e');
                    canvas.drawRect(x * TILE_SIZE + 6, y * TILE_SIZE + 8, 20, 12, '#c4a862');
                }

                // Zone exit glow
                if (tile === 8) {
                    const glow = Math.sin(Date.now() / 300) * 0.2 + 0.3;
                    canvas.ctx.fillStyle = `rgba(232,212,77,${glow})`;
                    canvas.ctx.fillRect(
                        x * TILE_SIZE - canvas.camera.x + canvas.shake.x,
                        y * TILE_SIZE - canvas.camera.y + canvas.shake.y,
                        TILE_SIZE, TILE_SIZE
                    );
                }

                // Grid lines (subtle)
                canvas.drawRectOutline(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, 'rgba(0,0,0,0.05)');
            }
        }

        // Draw NPCs
        for (const npc of this.npcs) {
            if (npc.x >= startCol && npc.x < endCol && npc.y >= startRow && npc.y < endRow) {
                this.renderNpc(canvas, npc);
            }
        }

        // Draw player
        this.player.render(canvas);

        // Draw tall grass over player (for depth effect)
        for (let y = startRow; y < endRow; y++) {
            for (let x = startCol; x < endCol; x++) {
                if (this.map[y][x] === 2) {
                    canvas.drawRect(x * TILE_SIZE + 8, y * TILE_SIZE + 20, 3, 8, '#3d7a2e80');
                    canvas.drawRect(x * TILE_SIZE + 20, y * TILE_SIZE + 22, 3, 7, '#3d7a2e80');
                }
            }
        }

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
        const dx = npc.x * TILE_SIZE - canvas.camera.x + canvas.shake.x;
        const dy = npc.y * TILE_SIZE - canvas.camera.y + canvas.shake.y;

        // Shadow
        canvas.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        canvas.ctx.beginPath();
        canvas.ctx.ellipse(dx + TILE_SIZE / 2, dy + TILE_SIZE - 2, 10, 4, 0, 0, Math.PI * 2);
        canvas.ctx.fill();

        // Body
        canvas.ctx.fillStyle = npc.sprite || '#e74c3c';
        canvas.ctx.fillRect(dx + 6, dy + 8, TILE_SIZE - 12, TILE_SIZE - 10);

        // Head
        canvas.ctx.fillStyle = '#f5cba7';
        canvas.ctx.beginPath();
        canvas.ctx.arc(dx + TILE_SIZE / 2, dy + 8, 8, 0, Math.PI * 2);
        canvas.ctx.fill();

        // Role indicator
        const indicators = {
            healer: '#ff69b4',
            shopkeeper: '#ffd700',
            trainer: '#ff4444',
            boss: '#ff0000',
            professor: '#4488cc',
            questgiver: '#44ff44',
        };
        if (indicators[npc.role]) {
            canvas.ctx.fillStyle = indicators[npc.role];
            canvas.ctx.beginPath();
            canvas.ctx.arc(dx + TILE_SIZE / 2, dy - 2, 4, 0, Math.PI * 2);
            canvas.ctx.fill();
        }

        // Exclamation mark for quest givers with available quests
        if (npc.role === 'questgiver' && npc.questId && !this.game.globalState.questStates[npc.questId]) {
            canvas.drawTextShadow('!', dx + TILE_SIZE / 2, dy - 12, '#ffff00', 14, 'center');
        }
    }

    renderHUD(canvas) {
        // Top bar
        canvas.drawRectUI(0, 0, SCREEN_W, 24, 'rgba(0,0,0,0.6)');

        // Region name
        canvas.drawText(this.mapMeta?.name || this.regionId, 8, 5, '#fff', 12);

        // Party HP dots
        const dotX = SCREEN_W - 8;
        for (let i = this.player.party.length - 1; i >= 0; i--) {
            const c = this.player.party[i];
            const color = c.isFainted ? '#f44336' : (c.hpRatio > 0.5 ? '#4caf50' : (c.hpRatio > 0.25 ? '#ff9800' : '#f44336'));
            canvas.drawCircleUI(dotX - (this.player.party.length - 1 - i) * 14, 12, 5, color);
        }

        // Gold
        canvas.drawText(`${this.game.globalState.gold}G`, SCREEN_W / 2, 5, '#ffd700', 11, 'center');

        // Current quest hint
        const mainQuest = this.questSystem?.getCurrentMainQuest();
        if (mainQuest) {
            const obj = mainQuest.objectives.find(o => !o.completed);
            if (obj) {
                canvas.drawRectUI(0, SCREEN_H - 20, SCREEN_W, 20, 'rgba(0,0,0,0.4)');
                canvas.drawText(`Quest: ${obj.description}`, 8, SCREEN_H - 16, '#aaa', 10);
            }
        }
    }

    renderDialogue(canvas) {
        const boxH = 70;
        const boxY = SCREEN_H - boxH - 10;

        // Box background
        canvas.drawRectUI(10, boxY, SCREEN_W - 20, boxH, 'rgba(10,10,30,0.92)');
        canvas.drawRectOutlineUI(10, boxY, SCREEN_W - 20, boxH, '#fff', 2);

        // NPC name
        if (this.interactingNpc) {
            canvas.drawText(this.interactingNpc.name, 20, boxY + 6, '#ff6b35', 12);
        }

        // Text
        const text = this.dialogueText[this.dialogueIndex] || '';
        const nameOffset = this.interactingNpc ? 20 : 8;
        this.wrapText(canvas, text, 20, boxY + nameOffset, SCREEN_W - 50, 12, '#fff');

        // Continue indicator
        const blink = Math.sin(Date.now() / 300) > 0;
        if (blink) {
            canvas.drawText('v', SCREEN_W - 30, boxY + boxH - 16, '#fff', 12, 'center');
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
        const alpha = Math.min(1, this.notificationTimer / 500);
        canvas.setAlpha(alpha);
        canvas.drawRectUI(SCREEN_W / 2 - 100, 30, 200, 28, 'rgba(0,0,0,0.8)');
        canvas.drawRectOutlineUI(SCREEN_W / 2 - 100, 30, 200, 28, '#ff6b35', 1);
        canvas.drawText(this.notification, SCREEN_W / 2, 37, '#fff', 12, 'center');
        canvas.resetAlpha();
    }
}
