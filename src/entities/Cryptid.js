import { randomInt } from '../utils/math.js';
import { MAX_LEVEL, MAX_MOVES } from '../utils/constants.js';

export class Cryptid {
    constructor(template, level) {
        this.templateId = template.id;
        this.name = template.name;
        this.nickname = null;
        this.types = [...template.types];
        this.baseStats = { ...template.baseStats };
        this.level = Math.min(level, MAX_LEVEL);
        this.xp = 0;
        this.xpToNext = this.calcXpToNext();
        this.spriteColor = template.spriteColor || '#888';
        this.description = template.description;

        // IVs (0-15 bonus to each stat)
        this.ivs = {
            hp: randomInt(0, 15),
            atk: randomInt(0, 15),
            def: randomInt(0, 15),
            spAtk: randomInt(0, 15),
            spDef: randomInt(0, 15),
            spd: randomInt(0, 15),
        };

        // Calculate stats
        this.stats = this.calcStats();
        this.hp = this.stats.hp;
        this.maxHp = this.stats.hp;

        // Learn moves up to current level
        this.moves = [];
        this.pp = [];
        this.maxPp = [];
        const learnset = template.learnset || [];
        for (const entry of learnset) {
            if (entry.level <= this.level) {
                this.learnMove(entry.moveId);
            }
        }

        // Status
        this.status = 'none'; // none, burn, paralyze, sleep, poison, freeze, confusion
        this.statusTurns = 0;
        this.statStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0 };

        // Battle state
        this.isWild = false;
        this.leechSeeded = false;
    }

    get displayName() {
        return this.nickname || this.name;
    }

    get isFainted() {
        return this.hp <= 0;
    }

    get hpRatio() {
        return this.hp / this.maxHp;
    }

    calcStats() {
        const l = this.level;
        const calc = (base, iv) => Math.floor(((2 * base + iv) * l) / 100 + 5);
        const hpCalc = Math.floor(((2 * this.baseStats.hp + this.ivs.hp) * l) / 100 + l + 10);
        return {
            hp: hpCalc,
            atk: calc(this.baseStats.atk, this.ivs.atk),
            def: calc(this.baseStats.def, this.ivs.def),
            spAtk: calc(this.baseStats.spAtk, this.ivs.spAtk),
            spDef: calc(this.baseStats.spDef, this.ivs.spDef),
            spd: calc(this.baseStats.spd, this.ivs.spd),
        };
    }

    getEffectiveStat(stat) {
        const base = this.stats[stat];
        const stage = this.statStages[stat] || 0;
        const multipliers = [2/8, 2/7, 2/6, 2/5, 2/4, 2/3, 2/2, 3/2, 4/2, 5/2, 6/2, 7/2, 8/2];
        return Math.floor(base * multipliers[stage + 6]);
    }

    calcXpToNext() {
        return Math.floor(this.level ** 3 * 0.8 + 20);
    }

    gainXp(amount) {
        if (this.level >= MAX_LEVEL) return { leveled: false };
        this.xp += amount;
        const results = { leveled: false, newMoves: [], levels: 0 };
        while (this.xp >= this.xpToNext && this.level < MAX_LEVEL) {
            this.xp -= this.xpToNext;
            this.levelUp(results);
        }
        return results;
    }

    levelUp(results) {
        this.level++;
        results.leveled = true;
        results.levels++;
        const oldMax = this.maxHp;
        this.stats = this.calcStats();
        this.maxHp = this.stats.hp;
        this.hp += (this.maxHp - oldMax); // Heal the HP gained from leveling
        this.xpToNext = this.calcXpToNext();
    }

    learnMove(moveId) {
        const { getMove } = require_moves();
        const move = getMove(moveId);
        if (!move) return false;

        if (this.moves.length < MAX_MOVES) {
            this.moves.push(moveId);
            this.pp.push(move.pp);
            this.maxPp.push(move.pp);
            return true;
        }
        return false; // Need to forget a move first
    }

    replaceMove(slotIndex, moveId) {
        const { getMove } = require_moves();
        const move = getMove(moveId);
        if (!move || slotIndex < 0 || slotIndex >= this.moves.length) return false;
        this.moves[slotIndex] = moveId;
        this.pp[slotIndex] = move.pp;
        this.maxPp[slotIndex] = move.pp;
        return true;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    fullHeal() {
        this.hp = this.maxHp;
        this.status = 'none';
        this.statusTurns = 0;
        for (let i = 0; i < this.pp.length; i++) {
            this.pp[i] = this.maxPp[i];
        }
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - Math.floor(amount));
        return this.hp <= 0;
    }

    resetBattleState() {
        this.statStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0 };
        this.leechSeeded = false;
    }

    serialize() {
        return {
            templateId: this.templateId,
            nickname: this.nickname,
            level: this.level,
            xp: this.xp,
            hp: this.hp,
            ivs: this.ivs,
            moves: [...this.moves],
            pp: [...this.pp],
            status: this.status,
        };
    }

    static deserialize(data, template) {
        const c = new Cryptid(template, data.level);
        c.nickname = data.nickname;
        c.xp = data.xp;
        c.ivs = data.ivs;
        c.stats = c.calcStats();
        c.maxHp = c.stats.hp;
        c.hp = data.hp;
        c.moves = data.moves;
        c.pp = data.pp;
        c.status = data.status || 'none';
        return c;
    }
}

// Lazy require to avoid circular deps
let _moves = null;
function require_moves() {
    if (!_moves) {
        _moves = { getMove: (id) => {
            // Inline lookup from moves data
            return window.__cryptidmon_moves?.find(m => m.id === id) || { pp: 10 };
        }};
    }
    return _moves;
}
