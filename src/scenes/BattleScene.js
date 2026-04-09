import { SCREEN_W, SCREEN_H, COLORS, TYPE_COLORS, TEXT_SPEED, HP_DRAIN_SPEED } from '../utils/constants.js';
import { clamp, lerp, randomInt, randomFloat, chance } from '../utils/math.js';
import { getItem, Items } from '../data/items.js';
import { getTheme } from '../ui/TileRenderer.js';

export class BattleScene {
    constructor(playerParty, enemyCryptid, isTrainer, trainerData, battleSystem, catchSystem, onBattleEnd, regionId = 'pinewatch') {
        this.game = null;
        this.canvas = null;
        this.input = null;

        this.regionId = regionId;
        this.theme = getTheme(regionId);

        this.playerParty = playerParty;
        this.playerCryptid = playerParty.find(c => !c.isFainted) || playerParty[0];
        this.isTrainer = isTrainer;
        this.trainerData = trainerData;
        this.battleSystem = battleSystem;
        this.catchSystem = catchSystem;
        this.onBattleEnd = onBattleEnd;

        // Enemy setup
        if (isTrainer && trainerData) {
            this.enemyTeam = trainerData.team.map(t => t.cryptid || t);
            this.enemyCryptid = this.enemyTeam.find(c => !c.isFainted) || this.enemyTeam[0];
            this.enemyTeamIndex = this.enemyTeam.indexOf(this.enemyCryptid);
        } else {
            this.enemyCryptid = enemyCryptid;
            this.enemyCryptid.isWild = true;
            this.enemyTeam = [this.enemyCryptid];
            this.enemyTeamIndex = 0;
        }

        // Bond mechanic for wild encounters
        this.bondLevel = 0;
        this.heartParticles = [];

        // State machine
        this.state = 'intro';
        this.prevState = null;
        this.menuIndex = 0;
        this.moveIndex = 0;
        this.itemIndex = 0;
        this.itemScrollOffset = 0;
        this.switchIndex = 0;

        // Message system
        this.messageQueue = [];
        this.currentMessage = '';
        this.displayedChars = 0;
        this.messageTimer = 0;
        this.messageCallback = null;

        // Animation state
        this.timer = 0;
        this.introTimer = 0;
        this.introDuration = 800;

        // Sprite positions (animated)
        this.enemySpriteX = SCREEN_W + 60;
        this.enemySpriteY = 60;
        this.playerSpriteX = -80;
        this.playerSpriteY = 200;
        this.enemyTargetX = 340;
        this.playerTargetX = 120;

        // Attack animation
        this.attackAnim = null; // {who, timer, duration, phase}
        this.flashTimer = 0;
        this.flashColor = null;

        // HP animation
        this.playerDisplayHp = this.playerCryptid.hp;
        this.enemyDisplayHp = this.enemyCryptid.hp;
        this.playerTargetHp = this.playerCryptid.hp;
        this.enemyTargetHp = this.enemyCryptid.hp;

        // XP animation
        this.xpAnimating = false;
        this.xpDisplay = this.playerCryptid.xp;
        this.xpTarget = this.playerCryptid.xp;

        // Faint animation
        this.faintAnim = null; // {who, timer, duration}

        // Catch animation
        this.catchAnim = null; // {timer, phase, shakes, shakesDone, caught}

        // Level up data
        this.levelUpData = null;

        // Calm animation
        this.calmAnim = null;

        // Victory/defeat
        this.battleOver = false;
        this.resultTimer = 0;

        // Turn execution queue
        this.turnQueue = [];
        this.executingTurn = false;

        // Pending switch after faint
        this.pendingFaintSwitch = false;

        // Navigation debounce
        this._prevUp = false;
        this._prevDown = false;
        this._prevLeft = false;
        this._prevRight = false;
    }

    enter() {
        this.state = 'intro';
        this.introTimer = 0;
        this.timer = 0;

        // Reset battle state on cryptids
        this.playerCryptid.resetBattleState();
        this.enemyCryptid.resetBattleState();
    }

    exit() {
        // Clean up battle state
        for (const c of this.playerParty) {
            c.resetBattleState();
        }
    }

    resume() {}

    // --- Utility ---
    getMove(moveId) {
        return window.__cryptidmon_moves?.find(m => m.id === moveId) || null;
    }

    getUsableItems() {
        const items = [];
        const inv = this.game.globalState.playerRef?.inventory ||
                    this.playerParty._inventory || {};
        // Try to get inventory from game state
        let inventory = {};
        if (this.game.globalState.playerRef) {
            inventory = this.game.globalState.playerRef.inventory || {};
        } else {
            // Fallback: look through scenes for player
            for (const scene of this.game.scenes) {
                if (scene.player && scene.player.inventory) {
                    inventory = scene.player.inventory;
                    break;
                }
            }
        }
        for (const [id, count] of Object.entries(inventory)) {
            if (count <= 0) continue;
            const item = getItem(id);
            if (!item) continue;
            // Only show battle-usable items
            if (item.type === 'trap' || item.type === 'potion' ||
                item.type === 'status_heal' || item.type === 'battle') {
                items.push({ ...item, count });
            }
        }
        return items;
    }

    getPlayerObject() {
        if (this.game.globalState.playerRef) return this.game.globalState.playerRef;
        for (const scene of this.game.scenes) {
            if (scene.player) return scene.player;
        }
        return null;
    }

    queueMessages(messages, callback) {
        if (!messages || messages.length === 0) {
            if (callback) callback();
            return;
        }
        for (let i = 0; i < messages.length; i++) {
            this.messageQueue.push({
                text: messages[i],
                callback: i === messages.length - 1 ? callback : null,
            });
        }
        if (this.state !== 'message') {
            this.prevState = this.state;
            this.state = 'message';
            this.advanceMessage();
        }
    }

    advanceMessage() {
        if (this.displayedChars < this.currentMessage.length) {
            // Reveal all chars instantly
            this.displayedChars = this.currentMessage.length;
            return;
        }
        if (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            this.currentMessage = msg.text;
            this.displayedChars = 0;
            this.messageTimer = 0;
            this.messageCallback = msg.callback;
        } else {
            // Done with messages
            if (this.messageCallback) {
                const cb = this.messageCallback;
                this.messageCallback = null;
                cb();
            } else {
                this.state = this.prevState || 'playerTurn';
            }
        }
    }

    // --- Direction helpers ---
    dirJustPressed(dir) {
        const key = `_prev${dir.charAt(0).toUpperCase() + dir.slice(1)}`;
        const current = dir === 'up' ? this.input.direction.y < 0 :
                       dir === 'down' ? this.input.direction.y > 0 :
                       dir === 'left' ? this.input.direction.x < 0 :
                       this.input.direction.x > 0;
        const prev = this[key];
        this[key] = current;
        return current && !prev;
    }

    updateDirectionTracking() {
        this._prevUp = this.input.direction.y < 0;
        this._prevDown = this.input.direction.y > 0;
        this._prevLeft = this.input.direction.x < 0;
        this._prevRight = this.input.direction.x > 0;
    }

    // --- UPDATE ---
    update(dt) {
        this.timer += dt;

        // Update heart particles
        this.heartParticles = this.heartParticles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
            return p.life > 0;
        });

        // Update HP bars smoothly
        if (this.playerDisplayHp !== this.playerTargetHp) {
            const diff = this.playerTargetHp - this.playerDisplayHp;
            const step = (this.playerCryptid.maxHp / (HP_DRAIN_SPEED / dt));
            if (Math.abs(diff) < step) {
                this.playerDisplayHp = this.playerTargetHp;
            } else {
                this.playerDisplayHp += Math.sign(diff) * step;
            }
        }
        if (this.enemyDisplayHp !== this.enemyTargetHp) {
            const diff = this.enemyTargetHp - this.enemyDisplayHp;
            const step = (this.enemyCryptid.maxHp / (HP_DRAIN_SPEED / dt));
            if (Math.abs(diff) < step) {
                this.enemyDisplayHp = this.enemyTargetHp;
            } else {
                this.enemyDisplayHp += Math.sign(diff) * step;
            }
        }

        // Update XP bar
        if (this.xpAnimating && this.xpDisplay !== this.xpTarget) {
            const step = Math.max(1, Math.abs(this.xpTarget - this.xpDisplay) * dt / 400);
            if (Math.abs(this.xpTarget - this.xpDisplay) < step + 1) {
                this.xpDisplay = this.xpTarget;
                this.xpAnimating = false;
            } else {
                this.xpDisplay += Math.sign(this.xpTarget - this.xpDisplay) * step;
            }
        }

        // Flash timer
        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }

        // Attack animation
        if (this.attackAnim) {
            this.attackAnim.timer += dt;
            const t = this.attackAnim.timer / this.attackAnim.duration;
            if (t >= 1) {
                this.attackAnim = null;
            }
        }

        // Faint animation
        if (this.faintAnim) {
            this.faintAnim.timer += dt;
            if (this.faintAnim.timer >= this.faintAnim.duration) {
                const cb = this.faintAnim.callback;
                this.faintAnim = null;
                if (cb) cb();
            }
        }

        // Catch animation
        if (this.catchAnim) {
            this.updateCatchAnimation(dt);
            return;
        }

        // Calm animation
        if (this.calmAnim) {
            this.calmAnim.timer += dt;
            if (this.calmAnim.timer >= this.calmAnim.duration) {
                const cb = this.calmAnim.callback;
                this.calmAnim = null;
                if (cb) cb();
            }
            return;
        }

        switch (this.state) {
            case 'intro': this.updateIntro(dt); break;
            case 'playerTurn': this.updatePlayerTurn(dt); break;
            case 'moveSelect': this.updateMoveSelect(dt); break;
            case 'itemSelect': this.updateItemSelect(dt); break;
            case 'switchSelect': this.updateSwitchSelect(dt); break;
            case 'message': this.updateMessage(dt); break;
            case 'executing': break; // Wait for animations
            case 'victory': this.updateVictory(dt); break;
            case 'defeat': this.updateDefeat(dt); break;
        }

        this.updateDirectionTracking();
    }

    updateIntro(dt) {
        this.introTimer += dt;
        const progress = Math.min(1, this.introTimer / this.introDuration);
        const ease = 1 - Math.pow(1 - progress, 3); // ease out cubic

        this.enemySpriteX = lerp(SCREEN_W + 60, this.enemyTargetX, ease);
        this.playerSpriteX = lerp(-80, this.playerTargetX, ease);

        if (this.introTimer >= this.introDuration) {
            this.enemySpriteX = this.enemyTargetX;
            this.playerSpriteX = this.playerTargetX;

            const introMessages = [];
            if (this.isTrainer && this.trainerData) {
                introMessages.push(`${this.trainerData.name} wants to battle!`);
                introMessages.push(`${this.trainerData.name} sent out ${this.enemyCryptid.displayName}!`);
            } else {
                introMessages.push(`A wild ${this.enemyCryptid.displayName} appeared!`);
            }
            introMessages.push(`Go, ${this.playerCryptid.displayName}!`);

            this.queueMessages(introMessages, () => {
                this.state = 'playerTurn';
            });
        }
    }

    updatePlayerTurn(dt) {
        // Check for pending faint switch
        if (this.pendingFaintSwitch) {
            this.pendingFaintSwitch = false;
            this.state = 'switchSelect';
            this.switchIndex = 0;
            return;
        }

        const upPressed = this.dirJustPressed('up');
        const downPressed = this.dirJustPressed('down');
        const leftPressed = this.dirJustPressed('left');
        const rightPressed = this.dirJustPressed('right');

        // 2x2 menu grid: [Fight, Bag], [Switch, Run/Calm]
        if (leftPressed) this.menuIndex = this.menuIndex % 2 === 1 ? this.menuIndex - 1 : this.menuIndex;
        if (rightPressed) this.menuIndex = this.menuIndex % 2 === 0 ? this.menuIndex + 1 : this.menuIndex;
        if (upPressed) this.menuIndex = this.menuIndex >= 2 ? this.menuIndex - 2 : this.menuIndex;
        if (downPressed) this.menuIndex = this.menuIndex < 2 ? this.menuIndex + 2 : this.menuIndex;
        this.menuIndex = clamp(this.menuIndex, 0, 3);

        if (this.input.actionJustPressed) {
            switch (this.menuIndex) {
                case 0: // Fight
                    this.state = 'moveSelect';
                    this.moveIndex = 0;
                    break;
                case 1: // Bag
                    this.state = 'itemSelect';
                    this.itemIndex = 0;
                    this.itemScrollOffset = 0;
                    break;
                case 2: // Switch
                    this.state = 'switchSelect';
                    this.switchIndex = 0;
                    break;
                case 3: // Run or Calm
                    if (!this.isTrainer) {
                        this.handleCalmOrRun();
                    } else {
                        this.handleRun();
                    }
                    break;
            }
        }
    }

    updateMoveSelect(dt) {
        const upPressed = this.dirJustPressed('up');
        const downPressed = this.dirJustPressed('down');
        const leftPressed = this.dirJustPressed('left');
        const rightPressed = this.dirJustPressed('right');

        const moveCount = this.playerCryptid.moves.length;

        if (leftPressed) this.moveIndex = this.moveIndex % 2 === 1 ? this.moveIndex - 1 : this.moveIndex;
        if (rightPressed) this.moveIndex = this.moveIndex % 2 === 0 && this.moveIndex + 1 < moveCount ? this.moveIndex + 1 : this.moveIndex;
        if (upPressed) this.moveIndex = this.moveIndex >= 2 ? this.moveIndex - 2 : this.moveIndex;
        if (downPressed) this.moveIndex = this.moveIndex < 2 && this.moveIndex + 2 < moveCount ? this.moveIndex + 2 : this.moveIndex;
        this.moveIndex = clamp(this.moveIndex, 0, moveCount - 1);

        if (this.input.actionJustPressed) {
            const moveId = this.playerCryptid.moves[this.moveIndex];
            const move = this.getMove(moveId);
            if (move && this.playerCryptid.pp[this.moveIndex] > 0) {
                this.executeTurn(this.moveIndex);
            } else {
                // No PP - show message
                this.queueMessages(['No PP left for this move!'], () => {
                    this.state = 'moveSelect';
                });
            }
        }

        if (this.input.cancelJustPressed) {
            this.state = 'playerTurn';
        }
    }

    updateItemSelect(dt) {
        const upPressed = this.dirJustPressed('up');
        const downPressed = this.dirJustPressed('down');
        const items = this.getUsableItems();

        if (items.length === 0) {
            this.queueMessages(['No usable items!'], () => {
                this.state = 'playerTurn';
            });
            return;
        }

        if (upPressed && this.itemIndex > 0) this.itemIndex--;
        if (downPressed && this.itemIndex < items.length - 1) this.itemIndex++;

        // Scroll
        const maxVisible = 4;
        if (this.itemIndex < this.itemScrollOffset) this.itemScrollOffset = this.itemIndex;
        if (this.itemIndex >= this.itemScrollOffset + maxVisible) this.itemScrollOffset = this.itemIndex - maxVisible + 1;

        if (this.input.actionJustPressed) {
            const item = items[this.itemIndex];
            this.useItem(item);
        }

        if (this.input.cancelJustPressed) {
            this.state = 'playerTurn';
        }
    }

    updateSwitchSelect(dt) {
        const upPressed = this.dirJustPressed('up');
        const downPressed = this.dirJustPressed('down');

        if (upPressed && this.switchIndex > 0) this.switchIndex--;
        if (downPressed && this.switchIndex < this.playerParty.length - 1) this.switchIndex++;

        if (this.input.actionJustPressed) {
            const target = this.playerParty[this.switchIndex];
            if (target === this.playerCryptid) {
                this.queueMessages([`${target.displayName} is already in battle!`], () => {
                    this.state = 'switchSelect';
                });
            } else if (target.isFainted) {
                this.queueMessages([`${target.displayName} has fainted and can't battle!`], () => {
                    this.state = 'switchSelect';
                });
            } else {
                this.switchCryptid(this.switchIndex);
            }
        }

        if (this.input.cancelJustPressed) {
            if (this.pendingFaintSwitch) {
                // Can't cancel if forced to switch
                return;
            }
            this.state = 'playerTurn';
        }
    }

    updateMessage(dt) {
        // Typewriter effect
        this.messageTimer += dt;
        if (this.messageTimer >= TEXT_SPEED) {
            this.messageTimer = 0;
            if (this.displayedChars < this.currentMessage.length) {
                this.displayedChars++;
            }
        }

        if (this.input.actionJustPressed) {
            this.advanceMessage();
        }
    }

    updateVictory(dt) {
        this.resultTimer += dt;
        if (this.input.actionJustPressed && this.resultTimer > 500) {
            if (!this.battleOver) {
                this.battleOver = true;
                this.onBattleEnd({ result: 'win' });
            }
        }
    }

    updateDefeat(dt) {
        this.resultTimer += dt;
        if (this.input.actionJustPressed && this.resultTimer > 500) {
            if (!this.battleOver) {
                this.battleOver = true;
                this.onBattleEnd({ result: 'lose' });
            }
        }
    }

    // --- BATTLE LOGIC ---
    handleCalmOrRun() {
        // Wild battles: first check if bond is high enough to show Calm
        if (!this.isTrainer) {
            if (this.bondLevel >= 100) {
                // Already fully calm, try to run
                this.handleRun();
                return;
            }
            // Calm the cryptid
            const bondGain = randomInt(15, 25);
            this.bondLevel = Math.min(100, this.bondLevel + bondGain);

            // Spawn heart particles
            for (let i = 0; i < 6; i++) {
                this.heartParticles.push({
                    x: this.enemySpriteX + randomFloat(-30, 30),
                    y: this.enemySpriteY + randomFloat(-20, 10),
                    vx: randomFloat(-0.5, 0.5),
                    vy: randomFloat(-1.5, -0.5),
                    life: 1200,
                    maxLife: 1200,
                    alpha: 1,
                    size: randomFloat(6, 12),
                });
            }

            const calmMessages = [];
            if (this.bondLevel >= 100) {
                calmMessages.push(`You gently calm ${this.enemyCryptid.displayName}...`);
                calmMessages.push(`${this.enemyCryptid.displayName} is fully at ease! Catch rate boosted!`);
            } else {
                calmMessages.push(`You gently calm ${this.enemyCryptid.displayName}...`);
                calmMessages.push(`Bond level: ${this.bondLevel}/100`);
            }

            this.calmAnim = { timer: 0, duration: 600, callback: () => {
                this.queueMessages(calmMessages, () => {
                    this.doEnemyTurn();
                });
            }};
        }
    }

    handleRun() {
        if (this.isTrainer) {
            this.queueMessages(["Can't run from a trainer battle!"], () => {
                this.state = 'playerTurn';
            });
            return;
        }

        // Flee chance based on speed
        const playerSpd = this.playerCryptid.getEffectiveStat('spd');
        const enemySpd = this.enemyCryptid.getEffectiveStat('spd');
        const fleeChance = clamp((playerSpd / Math.max(1, enemySpd)) * 0.5 + 0.3, 0.2, 0.95);

        if (chance(fleeChance)) {
            this.queueMessages(['Got away safely!'], () => {
                this.battleOver = true;
                this.onBattleEnd({ result: 'flee' });
            });
        } else {
            this.queueMessages(["Couldn't get away!"], () => {
                this.doEnemyTurn();
            });
        }
    }

    useItem(item) {
        const player = this.getPlayerObject();
        if (!player) return;

        if (item.type === 'trap') {
            if (this.isTrainer) {
                this.queueMessages(["Can't use traps in trainer battles!"], () => {
                    this.state = 'itemSelect';
                });
                return;
            }

            player.removeItem(item.id);

            // Apply bond bonus to catch rate
            const bondBonus = this.bondLevel / 200;
            const modifiedItem = { ...item, catchModifier: (item.catchModifier || 1) + bondBonus };

            const result = this.catchSystem.attemptCatch(this.enemyCryptid, modifiedItem);
            this.startCatchAnimation(result);
            return;
        }

        if (item.type === 'potion') {
            if (item.revive) {
                // Need to pick a fainted cryptid - for simplicity use first fainted
                const fainted = this.playerParty.find(c => c.isFainted);
                if (!fainted) {
                    this.queueMessages(['No fainted Cryptids to revive!'], () => {
                        this.state = 'itemSelect';
                    });
                    return;
                }
                player.removeItem(item.id);
                if (item.healAmount >= 9999) {
                    fainted.hp = fainted.maxHp;
                } else {
                    fainted.hp = Math.floor(fainted.maxHp * item.healAmount);
                }
                this.queueMessages([`${fainted.displayName} was revived!`], () => {
                    this.doEnemyTurn();
                });
            } else {
                player.removeItem(item.id);
                const before = this.playerCryptid.hp;
                this.playerCryptid.heal(item.healAmount >= 9999 ? this.playerCryptid.maxHp : item.healAmount);
                const healed = this.playerCryptid.hp - before;
                this.playerTargetHp = this.playerCryptid.hp;
                this.queueMessages([`${this.playerCryptid.displayName} recovered ${healed} HP!`], () => {
                    this.doEnemyTurn();
                });
            }
            return;
        }

        if (item.type === 'status_heal') {
            const cures = item.cures || [];
            if (cures.includes('all') || cures.includes(this.playerCryptid.status)) {
                if (this.playerCryptid.status === 'none') {
                    this.queueMessages([`${this.playerCryptid.displayName} has no status to cure!`], () => {
                        this.state = 'itemSelect';
                    });
                    return;
                }
                player.removeItem(item.id);
                this.playerCryptid.status = 'none';
                this.playerCryptid.statusTurns = 0;
                this.queueMessages([`${this.playerCryptid.displayName} was cured!`], () => {
                    this.doEnemyTurn();
                });
            } else {
                this.queueMessages(["It won't have any effect!"], () => {
                    this.state = 'itemSelect';
                });
            }
            return;
        }

        if (item.type === 'battle') {
            player.removeItem(item.id);
            if (item.statChange) {
                const msg = this.battleSystem.applyStatChange(this.playerCryptid, {
                    stat: item.statChange.stat,
                    stages: item.statChange.stages,
                    target: 'self',
                });
                this.queueMessages([msg || `${this.playerCryptid.displayName}'s stats changed!`], () => {
                    this.doEnemyTurn();
                });
            }
            return;
        }
    }

    switchCryptid(partyIndex, isForced = false) {
        const newCryptid = this.playerParty[partyIndex];
        const oldName = this.playerCryptid.displayName;

        const messages = [];
        if (!isForced) {
            messages.push(`${oldName}, come back!`);
        }
        messages.push(`Go, ${newCryptid.displayName}!`);

        this.playerCryptid.resetBattleState();
        this.playerCryptid = newCryptid;
        this.playerDisplayHp = newCryptid.hp;
        this.playerTargetHp = newCryptid.hp;
        this.xpDisplay = newCryptid.xp;
        this.xpTarget = newCryptid.xp;

        this.queueMessages(messages, () => {
            if (isForced) {
                this.state = 'playerTurn';
            } else {
                this.doEnemyTurn();
            }
        });
    }

    executeTurn(playerMoveIndex) {
        const playerMoveId = this.playerCryptid.moves[playerMoveIndex];
        const playerMove = this.getMove(playerMoveId);
        const enemyMoveIndex = this.battleSystem.getAIMove(this.enemyCryptid, this.playerCryptid);
        const enemyMoveId = this.enemyCryptid.moves[enemyMoveIndex];
        const enemyMove = this.getMove(enemyMoveId);

        const order = this.battleSystem.getTurnOrder(
            this.playerCryptid, this.enemyCryptid,
            playerMove, enemyMove
        );

        this.state = 'executing';

        if (order === 'a') {
            this.executePlayerMove(playerMoveIndex, playerMove, () => {
                if (this.enemyCryptid.isFainted) {
                    this.handleEnemyFaint();
                    return;
                }
                this.executeEnemyMove(enemyMoveIndex, enemyMove, () => {
                    if (this.playerCryptid.isFainted) {
                        this.handlePlayerFaint();
                        return;
                    }
                    this.endOfTurn();
                });
            });
        } else {
            this.executeEnemyMove(enemyMoveIndex, enemyMove, () => {
                if (this.playerCryptid.isFainted) {
                    this.handlePlayerFaint();
                    return;
                }
                this.executePlayerMove(playerMoveIndex, playerMove, () => {
                    if (this.enemyCryptid.isFainted) {
                        this.handleEnemyFaint();
                        return;
                    }
                    this.endOfTurn();
                });
            });
        }
    }

    executePlayerMove(moveIndex, move, callback) {
        // Check if can move
        const canMoveResult = this.battleSystem.canMove(this.playerCryptid);
        if (!canMoveResult.canMove) {
            const msgs = [];
            if (canMoveResult.message) msgs.push(canMoveResult.message);
            if (canMoveResult.reason) msgs.push(canMoveResult.reason);
            this.playerTargetHp = this.playerCryptid.hp;
            this.queueMessages(msgs.length ? msgs : ['...'], callback);
            return;
        }
        if (canMoveResult.message) {
            this.queueMessages([canMoveResult.message]);
        }

        const result = this.battleSystem.executeMove(
            this.playerCryptid, this.enemyCryptid, move, moveIndex
        );

        // Attack animation
        this.attackAnim = { who: 'player', timer: 0, duration: 400 };
        if (result.damage > 0) {
            setTimeout(() => {
                this.canvas.startShake(200, result.crit ? 8 : 4);
                this.flashTimer = 150;
                this.flashColor = result.effectiveness > 1 ? '#ff4444' :
                                  result.effectiveness < 1 ? '#888888' : '#ffffff';
            }, 200);
        }

        this.enemyTargetHp = this.enemyCryptid.hp;

        setTimeout(() => {
            this.queueMessages(result.messages, callback);
        }, result.damage > 0 ? 350 : 50);
    }

    executeEnemyMove(moveIndex, move, callback) {
        if (!move) { callback(); return; }

        const canMoveResult = this.battleSystem.canMove(this.enemyCryptid);
        if (!canMoveResult.canMove) {
            const msgs = [];
            if (canMoveResult.message) msgs.push(canMoveResult.message);
            if (canMoveResult.reason) msgs.push(canMoveResult.reason);
            this.enemyTargetHp = this.enemyCryptid.hp;
            this.queueMessages(msgs.length ? msgs : ['...'], callback);
            return;
        }
        if (canMoveResult.message) {
            this.queueMessages([canMoveResult.message]);
        }

        const result = this.battleSystem.executeMove(
            this.enemyCryptid, this.playerCryptid, move, moveIndex
        );

        this.attackAnim = { who: 'enemy', timer: 0, duration: 400 };
        if (result.damage > 0) {
            setTimeout(() => {
                this.canvas.startShake(200, result.crit ? 8 : 4);
                this.flashTimer = 150;
                this.flashColor = result.effectiveness > 1 ? '#ff4444' : '#ffffff';
            }, 200);
        }

        this.playerTargetHp = this.playerCryptid.hp;

        setTimeout(() => {
            this.queueMessages(result.messages, callback);
        }, result.damage > 0 ? 350 : 50);
    }

    doEnemyTurn() {
        this.state = 'executing';
        const moveIndex = this.battleSystem.getAIMove(this.enemyCryptid, this.playerCryptid);
        const moveId = this.enemyCryptid.moves[moveIndex];
        const move = this.getMove(moveId);

        this.executeEnemyMove(moveIndex, move, () => {
            if (this.playerCryptid.isFainted) {
                this.handlePlayerFaint();
                return;
            }
            this.endOfTurnEnemyOnly();
        });
    }

    endOfTurn() {
        // End of turn effects for both
        const playerEot = this.battleSystem.applyEndOfTurnEffects(this.playerCryptid);
        const enemyEot = this.battleSystem.applyEndOfTurnEffects(this.enemyCryptid);
        this.playerTargetHp = this.playerCryptid.hp;
        this.enemyTargetHp = this.enemyCryptid.hp;

        const allMsgs = [...playerEot, ...enemyEot];

        if (allMsgs.length > 0) {
            this.queueMessages(allMsgs, () => {
                if (this.playerCryptid.isFainted) {
                    this.handlePlayerFaint();
                } else if (this.enemyCryptid.isFainted) {
                    this.handleEnemyFaint();
                } else {
                    this.state = 'playerTurn';
                }
            });
        } else {
            if (this.playerCryptid.isFainted) {
                this.handlePlayerFaint();
            } else if (this.enemyCryptid.isFainted) {
                this.handleEnemyFaint();
            } else {
                this.state = 'playerTurn';
            }
        }
    }

    endOfTurnEnemyOnly() {
        const enemyEot = this.battleSystem.applyEndOfTurnEffects(this.enemyCryptid);
        const playerEot = this.battleSystem.applyEndOfTurnEffects(this.playerCryptid);
        this.playerTargetHp = this.playerCryptid.hp;
        this.enemyTargetHp = this.enemyCryptid.hp;

        const allMsgs = [...playerEot, ...enemyEot];
        if (allMsgs.length > 0) {
            this.queueMessages(allMsgs, () => {
                if (this.playerCryptid.isFainted) {
                    this.handlePlayerFaint();
                } else if (this.enemyCryptid.isFainted) {
                    this.handleEnemyFaint();
                } else {
                    this.state = 'playerTurn';
                }
            });
        } else {
            if (this.playerCryptid.isFainted) {
                this.handlePlayerFaint();
            } else if (this.enemyCryptid.isFainted) {
                this.handleEnemyFaint();
            } else {
                this.state = 'playerTurn';
            }
        }
    }

    handleEnemyFaint() {
        this.faintAnim = { who: 'enemy', timer: 0, duration: 600, callback: () => {
            const msgs = [`${this.enemyCryptid.displayName} fainted!`];

            // XP gain
            const xpGain = this.battleSystem.calcXpGain(
                this.playerCryptid, this.enemyCryptid, this.isTrainer
            );
            msgs.push(`${this.playerCryptid.displayName} gained ${xpGain} XP!`);

            this.queueMessages(msgs, () => {
                // Animate XP gain
                const result = this.playerCryptid.gainXp(xpGain);
                this.xpTarget = this.playerCryptid.xp;
                this.xpAnimating = true;

                if (result.leveled) {
                    this.levelUpData = result;
                    setTimeout(() => {
                        this.playerTargetHp = this.playerCryptid.hp;
                        this.playerDisplayHp = this.playerCryptid.hp;
                        this.flashTimer = 400;
                        this.flashColor = '#ffd700';
                        this.queueMessages(
                            [`${this.playerCryptid.displayName} grew to level ${this.playerCryptid.level}!`],
                            () => { this.checkEnemyTeamOrVictory(); }
                        );
                    }, 500);
                } else {
                    setTimeout(() => { this.checkEnemyTeamOrVictory(); }, 500);
                }
            });

            // Mark as caught in cryptidex
            if (this.game.globalState.cryptidexSeen) {
                this.game.globalState.cryptidexSeen.add(this.enemyCryptid.templateId);
            }
        }};
    }

    checkEnemyTeamOrVictory() {
        if (this.isTrainer) {
            // Check for next enemy cryptid
            const nextEnemy = this.enemyTeam.find(c => !c.isFainted);
            if (nextEnemy) {
                this.enemyCryptid = nextEnemy;
                this.enemyTeamIndex = this.enemyTeam.indexOf(nextEnemy);
                this.enemyDisplayHp = nextEnemy.hp;
                this.enemyTargetHp = nextEnemy.hp;
                this.enemyCryptid.resetBattleState();

                this.queueMessages(
                    [`${this.trainerData.name} sent out ${nextEnemy.displayName}!`],
                    () => { this.state = 'playerTurn'; }
                );
                return;
            }
        }

        // Victory
        this.state = 'victory';
        this.resultTimer = 0;
        const victoryMsgs = [];
        if (this.isTrainer) {
            victoryMsgs.push(`You defeated ${this.trainerData.name}!`);
            // Award gold
            const gold = (this.trainerData.reward || 500);
            this.game.globalState.gold += gold;
            victoryMsgs.push(`Received ${gold}G for winning!`);
            // Set defeated flag
            if (this.trainerData.id) {
                this.game.globalState.flags[`defeated_${this.trainerData.id}`] = true;
            }
        } else {
            victoryMsgs.push('You won the battle!');
        }
        this.queueMessages(victoryMsgs);
    }

    handlePlayerFaint() {
        this.faintAnim = { who: 'player', timer: 0, duration: 600, callback: () => {
            this.queueMessages([`${this.playerCryptid.displayName} fainted!`], () => {
                // Check for another alive party member
                const alive = this.playerParty.find(c => !c.isFainted);
                if (alive) {
                    this.pendingFaintSwitch = true;
                    this.state = 'switchSelect';
                    this.switchIndex = this.playerParty.indexOf(alive);
                } else {
                    // All fainted - defeat
                    this.state = 'defeat';
                    this.resultTimer = 0;
                    this.queueMessages(['You have no more Cryptids that can battle...', 'You blacked out!']);
                }
            });
        }};
    }

    // --- CATCH ANIMATION ---
    startCatchAnimation(result) {
        this.state = 'executing';
        this.catchAnim = {
            timer: 0,
            phase: 'throw', // throw, shake, result
            shakes: result.shakes,
            shakesDone: 0,
            caught: result.caught,
            trapX: this.playerSpriteX,
            trapY: this.playerSpriteY - 20,
            targetX: this.enemySpriteX,
            targetY: this.enemySpriteY,
            shakeAngle: 0,
            callback: null,
        };
    }

    updateCatchAnimation(dt) {
        const ca = this.catchAnim;
        ca.timer += dt;

        if (ca.phase === 'throw') {
            // Animate trap flying to enemy
            const t = Math.min(1, ca.timer / 500);
            ca.trapX = lerp(this.playerSpriteX, this.enemySpriteX, t);
            ca.trapY = lerp(this.playerSpriteY - 20, this.enemySpriteY, t) - Math.sin(t * Math.PI) * 60;

            if (t >= 1) {
                ca.phase = 'capture';
                ca.timer = 0;
                this.flashTimer = 200;
                this.flashColor = '#ffffff';
            }
        } else if (ca.phase === 'capture') {
            // Brief flash where enemy disappears
            if (ca.timer > 400) {
                ca.phase = 'shake';
                ca.timer = 0;
                ca.shakesDone = 0;
            }
        } else if (ca.phase === 'shake') {
            // Shake animation
            const shakeInterval = 600;
            const currentShakeTime = ca.timer % shakeInterval;
            ca.shakeAngle = Math.sin(currentShakeTime / shakeInterval * Math.PI * 4) * 15;

            const shakesCompleted = Math.floor(ca.timer / shakeInterval);
            if (shakesCompleted > ca.shakesDone) {
                ca.shakesDone = shakesCompleted;
                this.canvas.startShake(100, 2);
            }

            if (ca.shakesDone >= ca.shakes) {
                ca.phase = 'result';
                ca.timer = 0;
            }
        } else if (ca.phase === 'result') {
            if (ca.timer > 300 && !ca.messageSent) {
                ca.messageSent = true;
                if (ca.caught) {
                    this.flashTimer = 400;
                    this.flashColor = '#ffd700';
                    this.canvas.startShake(300, 3);

                    // Mark caught in cryptidex
                    if (this.game.globalState.cryptidexCaught) {
                        this.game.globalState.cryptidexCaught.add(this.enemyCryptid.templateId);
                    }

                    this.queueMessages(
                        ['Gotcha!', `${this.enemyCryptid.displayName} was caught!`],
                        () => {
                            this.catchAnim = null;
                            this.battleOver = true;
                            this.onBattleEnd({
                                result: 'caught',
                                capturedCryptid: this.enemyCryptid,
                            });
                        }
                    );
                } else {
                    this.queueMessages(
                        ['Oh no! It broke free!'],
                        () => {
                            this.catchAnim = null;
                            this.doEnemyTurn();
                        }
                    );
                }
            }
        }
    }

    // --- RENDER ---
    render(canvas) {
        this.renderBackground(canvas);
        this.renderBattleField(canvas);
        this.renderHPBars(canvas);
        this.renderBottomPanel(canvas);
        this.renderHeartParticles(canvas);
        this.renderFlash(canvas);
        this.renderCatchAnimation(canvas);
    }

    renderBackground(canvas) {
        const ctx = canvas.ctx;
        const t = this.theme;

        // Sky gradient - themed
        const sky = ctx.createLinearGradient(0, 0, 0, 160);
        const skyPalettes = {
            pinewatch:  ['#1a2a4a', '#4a6a9a', '#7aa8d0'],
            appalachia: ['#2a1a3a', '#5a4a7a', '#8a7ab0'],
            greatplains:['#3a2a1a', '#c88a4a', '#f0c888'],
            southwest:  ['#3a1a1a', '#d84828', '#f8a848'],
            mistyloch:  ['#1a2a3a', '#4a6a8a', '#a0c0d8'],
            frozenpeak: ['#1a2a4a', '#4a7ab0', '#b8d8ec'],
        };
        const pal = skyPalettes[this.regionId] || skyPalettes.pinewatch;
        sky.addColorStop(0, pal[0]);
        sky.addColorStop(0.5, pal[1]);
        sky.addColorStop(1, pal[2]);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, SCREEN_W, 160);

        // Distant silhouette mountains / details
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.moveTo(0, 140);
        for (let x = 0; x <= SCREEN_W; x += 20) {
            const h = 30 + Math.sin(x * 0.05) * 15 + Math.sin(x * 0.12) * 10;
            ctx.lineTo(x, 140 - h);
        }
        ctx.lineTo(SCREEN_W, 160);
        ctx.lineTo(0, 160);
        ctx.closePath();
        ctx.fill();

        // Sun/moon disc
        const sunColor = this.regionId === 'frozenpeak' || this.regionId === 'mistyloch' ? '#d8e8f8' : '#ffe082';
        ctx.fillStyle = sunColor;
        ctx.beginPath();
        ctx.arc(SCREEN_W - 80, 40, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `${sunColor}44`;
        ctx.beginPath();
        ctx.arc(SCREEN_W - 80, 40, 22, 0, Math.PI * 2);
        ctx.fill();

        // Ground gradient
        const ground = ctx.createLinearGradient(0, 158, 0, SCREEN_H);
        ground.addColorStop(0, t.grassHi);
        ground.addColorStop(0.5, t.grassBase);
        ground.addColorStop(1, t.grassLo);
        ctx.fillStyle = ground;
        ctx.fillRect(0, 158, SCREEN_W, SCREEN_H - 158);

        // Ground line highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(0, 158, SCREEN_W, 2);

        // Subtle ground texture dots + flowers
        for (let i = 0; i < 30; i++) {
            const gx = (i * 53 + 17) % SCREEN_W;
            const gy = 170 + (i * 37 + 11) % 60;
            ctx.fillStyle = i % 4 === 0 ? t.grassLo : 'rgba(0,0,0,0.12)';
            ctx.fillRect(gx, gy, 3, 2);
        }
        // Scattered flowers
        if (t.grassDecor && t.grassDecor.length) {
            for (let i = 0; i < 8; i++) {
                const gx = (i * 71 + 33) % SCREEN_W;
                const gy = 180 + (i * 23 + 7) % 50;
                ctx.fillStyle = t.grassDecor[i % t.grassDecor.length];
                ctx.fillRect(gx, gy, 2, 2);
            }
        }

        // Battle arena circles
        ctx.save();
        ctx.globalAlpha = 0.4;
        // Enemy circle
        const eg = ctx.createRadialGradient(this.enemyTargetX, 120, 10, this.enemyTargetX, 120, 70);
        eg.addColorStop(0, 'rgba(255,255,255,0.25)');
        eg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = eg;
        ctx.fillRect(this.enemyTargetX - 70, 50, 140, 140);
        // Player circle
        const pg = ctx.createRadialGradient(this.playerTargetX, 220, 10, this.playerTargetX, 220, 80);
        pg.addColorStop(0, 'rgba(255,255,255,0.25)');
        pg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = pg;
        ctx.fillRect(this.playerTargetX - 80, 150, 160, 140);
        ctx.restore();
    }

    renderBattleField(canvas) {
        // Enemy platform (ellipse)
        canvas.ctx.fillStyle = 'rgba(0,0,0,0.15)';
        canvas.ctx.beginPath();
        canvas.ctx.ellipse(this.enemySpriteX, this.enemySpriteY + 40, 50, 12, 0, 0, Math.PI * 2);
        canvas.ctx.fill();

        // Player platform
        canvas.ctx.fillStyle = 'rgba(0,0,0,0.15)';
        canvas.ctx.beginPath();
        canvas.ctx.ellipse(this.playerSpriteX, this.playerSpriteY + 45, 55, 14, 0, 0, Math.PI * 2);
        canvas.ctx.fill();

        // Enemy cryptid
        if (!this.isCatchHidingEnemy()) {
            let ex = this.enemySpriteX;
            let ey = this.enemySpriteY;
            let eAlpha = 1;

            // Attack lunge animation (enemy attacking)
            if (this.attackAnim && this.attackAnim.who === 'enemy') {
                const t = this.attackAnim.timer / this.attackAnim.duration;
                if (t < 0.3) {
                    const lunge = t / 0.3;
                    ex -= lunge * 30;
                    ey += lunge * 20;
                } else if (t < 0.5) {
                    const ret = (t - 0.3) / 0.2;
                    ex -= (1 - ret) * 30;
                    ey += (1 - ret) * 20;
                }
            }

            // Hit flash on enemy (player attacking)
            if (this.attackAnim && this.attackAnim.who === 'player') {
                const t = this.attackAnim.timer / this.attackAnim.duration;
                if (t > 0.4 && t < 0.7) {
                    eAlpha = Math.sin((t - 0.4) / 0.3 * Math.PI * 4) > 0 ? 1 : 0.3;
                }
            }

            // Faint animation
            if (this.faintAnim && this.faintAnim.who === 'enemy') {
                const t = this.faintAnim.timer / this.faintAnim.duration;
                ey += t * 40;
                eAlpha = 1 - t;
            }

            canvas.setAlpha(eAlpha);
            canvas.drawCryptidSprite(ex, ey, 55, this.enemyCryptid.spriteColor, null, false, this.enemyCryptid.templateId);
            canvas.resetAlpha();

            // Status icon for enemy
            if (this.enemyCryptid.status !== 'none') {
                this.renderStatusBadge(canvas, this.enemyCryptid.status, ex + 35, ey - 30);
            }
        }

        // Player cryptid
        {
            let px = this.playerSpriteX;
            let py = this.playerSpriteY;
            let pAlpha = 1;

            // Attack lunge animation (player attacking)
            if (this.attackAnim && this.attackAnim.who === 'player') {
                const t = this.attackAnim.timer / this.attackAnim.duration;
                if (t < 0.3) {
                    const lunge = t / 0.3;
                    px += lunge * 30;
                    py -= lunge * 20;
                } else if (t < 0.5) {
                    const ret = (t - 0.3) / 0.2;
                    px += (1 - ret) * 30;
                    py -= (1 - ret) * 20;
                }
            }

            // Hit flash on player (enemy attacking)
            if (this.attackAnim && this.attackAnim.who === 'enemy') {
                const t = this.attackAnim.timer / this.attackAnim.duration;
                if (t > 0.4 && t < 0.7) {
                    pAlpha = Math.sin((t - 0.4) / 0.3 * Math.PI * 4) > 0 ? 1 : 0.3;
                }
            }

            // Faint animation
            if (this.faintAnim && this.faintAnim.who === 'player') {
                const t = this.faintAnim.timer / this.faintAnim.duration;
                py += t * 40;
                pAlpha = 1 - t;
            }

            canvas.setAlpha(pAlpha);
            canvas.drawCryptidSprite(px, py, 65, this.playerCryptid.spriteColor, null, true, this.playerCryptid.templateId);
            canvas.resetAlpha();

            // Status icon for player
            if (this.playerCryptid.status !== 'none') {
                this.renderStatusBadge(canvas, this.playerCryptid.status, px - 40, py - 20);
            }
        }

        // Bond indicator for wild
        if (!this.isTrainer && this.bondLevel > 0) {
            const bondBarW = 50;
            const bondRatio = this.bondLevel / 100;
            canvas.drawBar(this.enemySpriteX - bondBarW / 2, this.enemySpriteY + 50, bondBarW, 4, bondRatio, '#ff69b4', '#333');
        }
    }

    isCatchHidingEnemy() {
        if (!this.catchAnim) return false;
        return this.catchAnim.phase === 'capture' || this.catchAnim.phase === 'shake' ||
               (this.catchAnim.phase === 'result' && this.catchAnim.caught);
    }

    renderStatusBadge(canvas, status, x, y) {
        const statusColors = {
            burn: '#f08030', paralyze: '#f8d030', sleep: '#a890f0',
            poison: '#a040a0', freeze: '#98d8d8', confusion: '#f85888',
        };
        const labels = {
            burn: 'BRN', paralyze: 'PAR', sleep: 'SLP',
            poison: 'PSN', freeze: 'FRZ', confusion: 'CNF',
        };
        const color = statusColors[status] || '#888';
        canvas.drawRectUI(x, y, 28, 12, color);
        canvas.drawText(labels[status] || '???', x + 14, y + 1, '#fff', 8, 'center');
    }

    renderHPBars(canvas) {
        // --- Enemy HP Bar (top right) ---
        const eBarX = 16;
        const eBarY = 16;
        const eBarW = 180;

        // Background panel
        canvas.drawRectUI(eBarX - 4, eBarY - 4, eBarW + 8, 44, 'rgba(10,10,30,0.85)');
        canvas.drawRectOutlineUI(eBarX - 4, eBarY - 4, eBarW + 8, 44, '#555', 1);

        // Name and level
        canvas.drawTextShadow(this.enemyCryptid.displayName, eBarX + 2, eBarY, '#fff', 12);
        canvas.drawText(`Lv${this.enemyCryptid.level}`, eBarX + eBarW - 4, eBarY, '#aaa', 10, 'right');

        // HP bar
        const eHpRatio = clamp(this.enemyDisplayHp / this.enemyCryptid.maxHp, 0, 1);
        const eHpColor = eHpRatio > 0.5 ? COLORS.hp : (eHpRatio > 0.25 ? COLORS.hpMid : COLORS.hpLow);
        canvas.drawText('HP', eBarX + 2, eBarY + 16, '#ffcc00', 9);
        canvas.drawBar(eBarX + 20, eBarY + 17, eBarW - 22, 8, eHpRatio, eHpColor, '#333');

        // HP numbers
        canvas.drawText(
            `${Math.ceil(this.enemyDisplayHp)}/${this.enemyCryptid.maxHp}`,
            eBarX + eBarW - 4, eBarY + 28, '#ccc', 9, 'right'
        );

        // --- Player HP Bar (bottom right-ish, above panel) ---
        const pBarX = SCREEN_W - 200;
        const pBarY = 168;
        const pBarW = 186;

        canvas.drawRectUI(pBarX - 4, pBarY - 4, pBarW + 8, 60, 'rgba(10,10,30,0.85)');
        canvas.drawRectOutlineUI(pBarX - 4, pBarY - 4, pBarW + 8, 60, '#555', 1);

        // Name and level
        canvas.drawTextShadow(this.playerCryptid.displayName, pBarX + 2, pBarY, '#fff', 12);
        canvas.drawText(`Lv${this.playerCryptid.level}`, pBarX + pBarW - 4, pBarY, '#aaa', 10, 'right');

        // HP bar
        const pHpRatio = clamp(this.playerDisplayHp / this.playerCryptid.maxHp, 0, 1);
        const pHpColor = pHpRatio > 0.5 ? COLORS.hp : (pHpRatio > 0.25 ? COLORS.hpMid : COLORS.hpLow);
        canvas.drawText('HP', pBarX + 2, pBarY + 16, '#ffcc00', 9);
        canvas.drawBar(pBarX + 20, pBarY + 17, pBarW - 22, 8, pHpRatio, pHpColor, '#333');

        // HP numbers
        canvas.drawText(
            `${Math.ceil(this.playerDisplayHp)}/${this.playerCryptid.maxHp}`,
            pBarX + pBarW - 4, pBarY + 28, '#ccc', 9, 'right'
        );

        // XP bar
        const xpRatio = this.playerCryptid.xpToNext > 0 ?
            clamp(this.xpDisplay / this.playerCryptid.xpToNext, 0, 1) : 0;
        canvas.drawText('XP', pBarX + 2, pBarY + 38, '#42a5f5', 9);
        canvas.drawBar(pBarX + 20, pBarY + 39, pBarW - 22, 6, xpRatio, COLORS.xp, '#222');
    }

    renderBottomPanel(canvas) {
        const panelY = 240;
        const panelH = SCREEN_H - panelY;

        // Panel background
        canvas.drawRectUI(0, panelY, SCREEN_W, panelH, 'rgba(10,10,30,0.92)');
        canvas.drawRectUI(0, panelY, SCREEN_W, 2, '#444');

        switch (this.state) {
            case 'intro':
            case 'message':
            case 'executing':
            case 'victory':
            case 'defeat':
                this.renderMessageBox(canvas, panelY);
                break;
            case 'playerTurn':
                this.renderMainMenu(canvas, panelY);
                break;
            case 'moveSelect':
                this.renderMoveSelect(canvas, panelY);
                break;
            case 'itemSelect':
                this.renderItemSelect(canvas, panelY);
                break;
            case 'switchSelect':
                this.renderSwitchSelect(canvas, panelY);
                break;
        }
    }

    renderMessageBox(canvas, panelY) {
        const text = this.currentMessage.substring(0, this.displayedChars);
        this.wrapText(canvas, text, 16, panelY + 12, SCREEN_W - 32, 14, '#fff');

        // Advance indicator
        if (this.displayedChars >= this.currentMessage.length) {
            const blink = Math.sin(this.timer / 300) > 0;
            if (blink) {
                canvas.drawText('\u25bc', SCREEN_W - 20, panelY + panelY - 240 + 60, '#aaa', 12, 'center');
            }
        }

        // Victory/defeat special text
        if (this.state === 'victory' && this.resultTimer > 500) {
            canvas.drawText('Press A to continue', SCREEN_W / 2, SCREEN_H - 16, '#888', 10, 'center');
        }
        if (this.state === 'defeat' && this.resultTimer > 500) {
            canvas.drawText('Press A to continue', SCREEN_W / 2, SCREEN_H - 16, '#888', 10, 'center');
        }
    }

    renderMainMenu(canvas, panelY) {
        // "What will you do?" text on left
        canvas.drawTextShadow(`What will ${this.playerCryptid.displayName} do?`, 16, panelY + 8, '#fff', 12);

        const labels = ['Fight', 'Bag', 'Switch', this.isTrainer ? 'Run' : 'Calm'];
        const colors = ['#e74c3c', '#f39c12', '#3498db', this.isTrainer ? '#888' : '#ff69b4'];

        const btnW = 100;
        const btnH = 28;
        const startX = SCREEN_W - 220;
        const startY = panelY + 6;
        const gapX = 8;
        const gapY = 6;

        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const bx = startX + col * (btnW + gapX);
            const by = startY + row * (btnH + gapY);
            const selected = i === this.menuIndex;

            // Button background
            canvas.drawRectUI(bx, by, btnW, btnH, selected ? colors[i] : 'rgba(40,40,60,0.9)');
            if (selected) {
                canvas.drawRectOutlineUI(bx, by, btnW, btnH, '#fff', 2);
            } else {
                canvas.drawRectOutlineUI(bx, by, btnW, btnH, colors[i], 1);
            }

            // Label
            canvas.drawTextShadow(labels[i], bx + btnW / 2, by + 7, selected ? '#fff' : '#ccc', 12, 'center');
        }
    }

    renderMoveSelect(canvas, panelY) {
        const moves = this.playerCryptid.moves;
        const btnW = 116;
        const btnH = 32;
        const startX = 8;
        const startY = panelY + 6;
        const gapX = 6;
        const gapY = 4;

        for (let i = 0; i < moves.length; i++) {
            const move = this.getMove(moves[i]);
            if (!move) continue;

            const col = i % 2;
            const row = Math.floor(i / 2);
            const bx = startX + col * (btnW + gapX);
            const by = startY + row * (btnH + gapY);
            const selected = i === this.moveIndex;
            const typeColor = TYPE_COLORS[move.type] || '#888';
            const noPP = this.playerCryptid.pp[i] <= 0;

            // Button
            canvas.drawRectUI(bx, by, btnW, btnH, selected ? typeColor : 'rgba(40,40,60,0.9)');
            if (selected) {
                canvas.drawRectOutlineUI(bx, by, btnW, btnH, '#fff', 2);
            } else {
                canvas.drawRectOutlineUI(bx, by, btnW, btnH, typeColor, 1);
            }

            // Move name
            const textColor = noPP ? '#666' : (selected ? '#fff' : '#ddd');
            canvas.drawText(move.name, bx + 4, by + 3, textColor, 11);

            // PP
            const ppColor = noPP ? '#f44' : '#aaa';
            canvas.drawText(
                `PP ${this.playerCryptid.pp[i]}/${this.playerCryptid.maxPp[i]}`,
                bx + btnW - 4, by + 3, ppColor, 9, 'right'
            );

            // Type badge
            canvas.drawRectUI(bx + 4, by + 18, 40, 10, typeColor);
            canvas.drawText(move.type.charAt(0).toUpperCase() + move.type.slice(1), bx + 24, by + 19, '#fff', 7, 'center');

            // Power indicator
            if (move.power > 0) {
                canvas.drawText(`Pow:${move.power}`, bx + 52, by + 19, '#aaa', 8);
            } else {
                canvas.drawText('Status', bx + 52, by + 19, '#aaa', 8);
            }
        }

        // Move description on right side
        if (moves[this.moveIndex]) {
            const selMove = this.getMove(moves[this.moveIndex]);
            if (selMove) {
                const descX = SCREEN_W - 220;
                canvas.drawRectUI(descX - 4, panelY + 4, 216, panelY + 72 - panelY, 'rgba(20,20,40,0.8)');
                canvas.drawRectOutlineUI(descX - 4, panelY + 4, 216, 68, '#555', 1);
                canvas.drawText(selMove.description || '', descX, panelY + 10, '#bbb', 9);
                canvas.drawText(`Accuracy: ${selMove.accuracy}%`, descX, panelY + 28, '#aaa', 9);
                canvas.drawText(`Category: ${selMove.category}`, descX, panelY + 42, '#aaa', 9);
                if (selMove.effect && selMove.effect !== 'none') {
                    canvas.drawText(`Effect: ${selMove.effect} (${selMove.effectChance}%)`, descX, panelY + 56, '#da8', 9);
                }
            }
        }

        // Back hint
        canvas.drawText('B: Back', SCREEN_W - 50, SCREEN_H - 14, '#666', 9, 'right');
    }

    renderItemSelect(canvas, panelY) {
        const items = this.getUsableItems();
        const maxVisible = 4;
        const itemH = 18;
        const startX = 16;
        const startY = panelY + 8;

        canvas.drawTextShadow('Items', startX, panelY - 16 + 12, '#ffd700', 11);

        if (items.length === 0) {
            canvas.drawText('No usable items', startX, startY, '#888', 11);
        } else {
            for (let i = 0; i < Math.min(maxVisible, items.length - this.itemScrollOffset); i++) {
                const idx = i + this.itemScrollOffset;
                const item = items[idx];
                const by = startY + i * itemH;
                const selected = idx === this.itemIndex;

                if (selected) {
                    canvas.drawRectUI(startX - 4, by - 2, SCREEN_W / 2 - 8, itemH, 'rgba(255,255,255,0.1)');
                    canvas.drawText('\u25b6', startX - 2, by, '#ff6b35', 10);
                }

                canvas.drawText(item.name, startX + 12, by, selected ? '#fff' : '#bbb', 11);
                canvas.drawText(`x${item.count}`, startX + 160, by, '#aaa', 10);
            }

            // Scroll indicators
            if (this.itemScrollOffset > 0) {
                canvas.drawText('\u25b2', startX + 80, startY - 10, '#888', 9, 'center');
            }
            if (this.itemScrollOffset + maxVisible < items.length) {
                canvas.drawText('\u25bc', startX + 80, startY + maxVisible * itemH + 2, '#888', 9, 'center');
            }

            // Item description on right
            if (items[this.itemIndex]) {
                const descX = SCREEN_W / 2 + 8;
                canvas.drawRectUI(descX - 4, panelY + 4, SCREEN_W / 2 - 8, 68, 'rgba(20,20,40,0.8)');
                canvas.drawRectOutlineUI(descX - 4, panelY + 4, SCREEN_W / 2 - 8, 68, '#555', 1);
                this.wrapText(canvas, items[this.itemIndex].description || '', descX, panelY + 10, SCREEN_W / 2 - 20, 10, '#bbb');
            }
        }

        canvas.drawText('B: Back', SCREEN_W - 50, SCREEN_H - 14, '#666', 9, 'right');
    }

    renderSwitchSelect(canvas, panelY) {
        const startX = 16;
        const startY = panelY + 6;
        const slotH = 24;

        if (this.pendingFaintSwitch) {
            canvas.drawTextShadow('Choose a Cryptid!', startX, panelY - 16 + 14, '#ff6b35', 11);
        }

        for (let i = 0; i < this.playerParty.length; i++) {
            const c = this.playerParty[i];
            const by = startY + i * slotH;
            const selected = i === this.switchIndex;
            const isActive = c === this.playerCryptid;

            // Background
            const bgColor = c.isFainted ? 'rgba(100,30,30,0.4)' :
                            isActive ? 'rgba(30,80,30,0.4)' :
                            selected ? 'rgba(255,255,255,0.1)' : 'transparent';
            canvas.drawRectUI(startX - 4, by - 2, SCREEN_W - 24, slotH - 2, bgColor);

            if (selected) {
                canvas.drawRectOutlineUI(startX - 4, by - 2, SCREEN_W - 24, slotH - 2, '#ff6b35', 1);
                canvas.drawText('\u25b6', startX, by + 2, '#ff6b35', 10);
            }

            // Name
            const nameColor = c.isFainted ? '#888' : '#fff';
            canvas.drawText(c.displayName, startX + 14, by + 2, nameColor, 11);

            // Level
            canvas.drawText(`Lv${c.level}`, startX + 120, by + 2, '#aaa', 10);

            // HP bar mini
            const hpBarX = startX + 160;
            const hpRatio = c.hp / c.maxHp;
            const hpColor = c.isFainted ? '#444' :
                           hpRatio > 0.5 ? COLORS.hp :
                           hpRatio > 0.25 ? COLORS.hpMid : COLORS.hpLow;
            canvas.drawBar(hpBarX, by + 4, 80, 6, hpRatio, hpColor, '#333');

            // HP text
            canvas.drawText(`${c.hp}/${c.maxHp}`, hpBarX + 84, by + 2, '#aaa', 9);

            // Status
            if (c.status !== 'none') {
                this.renderStatusBadge(canvas, c.status, SCREEN_W - 60, by + 2);
            }

            // Active indicator
            if (isActive && !c.isFainted) {
                canvas.drawText('IN', SCREEN_W - 40, by + 2, '#4caf50', 9);
            }
        }

        if (!this.pendingFaintSwitch) {
            canvas.drawText('B: Back', SCREEN_W - 50, SCREEN_H - 14, '#666', 9, 'right');
        }
    }

    renderHeartParticles(canvas) {
        for (const p of this.heartParticles) {
            canvas.setAlpha(p.alpha);
            // Draw a simple heart shape
            const hx = p.x;
            const hy = p.y;
            const s = p.size;
            canvas.ctx.fillStyle = '#ff69b4';
            canvas.ctx.beginPath();
            canvas.ctx.moveTo(hx, hy + s * 0.3);
            canvas.ctx.bezierCurveTo(hx - s * 0.5, hy - s * 0.3, hx - s, hy + s * 0.1, hx, hy + s * 0.7);
            canvas.ctx.moveTo(hx, hy + s * 0.3);
            canvas.ctx.bezierCurveTo(hx + s * 0.5, hy - s * 0.3, hx + s, hy + s * 0.1, hx, hy + s * 0.7);
            canvas.ctx.fill();
            canvas.resetAlpha();
        }
    }

    renderFlash(canvas) {
        if (this.flashTimer > 0 && this.flashColor) {
            const alpha = (this.flashTimer / 400) * 0.4;
            canvas.setAlpha(alpha);
            canvas.fill(this.flashColor);
            canvas.resetAlpha();
        }
    }

    renderCatchAnimation(canvas) {
        if (!this.catchAnim) return;
        const ca = this.catchAnim;

        if (ca.phase === 'throw') {
            // Draw trap projectile
            canvas.drawCircleUI(ca.trapX, ca.trapY, 6, '#e74c3c');
            canvas.drawCircleUI(ca.trapX, ca.trapY, 3, '#fff');
        }

        if (ca.phase === 'shake' || (ca.phase === 'result' && ca.caught)) {
            // Draw trap on ground where enemy was, with shake rotation
            const tx = this.enemySpriteX;
            const ty = this.enemySpriteY + 20;
            canvas.ctx.save();
            canvas.ctx.translate(tx, ty);
            canvas.ctx.rotate(ca.shakeAngle * Math.PI / 180);
            canvas.ctx.fillStyle = '#e74c3c';
            canvas.ctx.fillRect(-8, -8, 16, 16);
            canvas.ctx.fillStyle = '#fff';
            canvas.ctx.fillRect(-3, -8, 6, 8);
            canvas.ctx.fillStyle = '#333';
            canvas.ctx.fillRect(-2, -2, 4, 4);
            canvas.ctx.restore();

            // Shake stars
            if (ca.phase === 'shake') {
                const sparkle = Math.sin(ca.timer / 100) > 0;
                if (sparkle) {
                    canvas.drawText('\u2726', tx - 14, ty - 16, '#ffd700', 10);
                    canvas.drawText('\u2726', tx + 10, ty - 12, '#ffd700', 8);
                }
            }
        }

        if (ca.phase === 'capture') {
            // Flash
            const t = ca.timer / 400;
            canvas.setAlpha(1 - t);
            canvas.fill('#fff');
            canvas.resetAlpha();
        }

        if (ca.phase === 'result' && ca.caught && ca.timer > 200) {
            // Caught sparkles
            const sparkleCount = 8;
            for (let i = 0; i < sparkleCount; i++) {
                const angle = (i / sparkleCount) * Math.PI * 2 + ca.timer / 200;
                const dist = 15 + Math.sin(ca.timer / 150 + i) * 8;
                const sx = this.enemySpriteX + Math.cos(angle) * dist;
                const sy = this.enemySpriteY + 20 + Math.sin(angle) * dist;
                canvas.drawCircleUI(sx, sy, 2, '#ffd700');
            }
        }

        if (ca.phase === 'result' && !ca.caught && ca.timer > 100) {
            // Break free burst
            const burstT = Math.min(1, (ca.timer - 100) / 300);
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const dist = burstT * 25;
                const sx = this.enemySpriteX + Math.cos(angle) * dist;
                const sy = this.enemySpriteY + 20 + Math.sin(angle) * dist;
                canvas.setAlpha(1 - burstT);
                canvas.drawCircleUI(sx, sy, 3, '#ff4444');
                canvas.resetAlpha();
            }
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
}
