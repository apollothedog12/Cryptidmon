import { getEffectiveness, getEffectivenessText } from '../data/types.js';
import { STAB_BONUS, CRIT_CHANCE, CRIT_MULTIPLIER } from '../utils/constants.js';
import { randomFloat, randomInt, chance } from '../utils/math.js';

export class BattleSystem {
    constructor() {
        this.log = [];
    }

    calculateDamage(attacker, defender, move) {
        if (move.category === 'status') return 0;

        const level = attacker.level;
        const isPhysical = move.category === 'physical';
        const atkStat = isPhysical ? attacker.getEffectiveStat('atk') : attacker.getEffectiveStat('spAtk');
        const defStat = isPhysical ? defender.getEffectiveStat('def') : defender.getEffectiveStat('spDef');

        // Base damage
        let damage = ((2 * level / 5 + 2) * move.power * atkStat / defStat) / 50 + 2;

        // STAB
        const stab = attacker.types.includes(move.type) ? STAB_BONUS : 1;
        damage *= stab;

        // Type effectiveness
        const effectiveness = getEffectiveness(move.type, defender.types);
        damage *= effectiveness;

        // Critical hit
        let crit = false;
        const critRate = move.critBoost ? CRIT_CHANCE * 4 : CRIT_CHANCE;
        if (chance(critRate)) {
            damage *= CRIT_MULTIPLIER;
            crit = true;
        }

        // Random factor (85-100%)
        damage *= randomFloat(0.85, 1.0);

        // Burn halves physical damage
        if (attacker.status === 'burn' && isPhysical) {
            damage *= 0.5;
        }

        return {
            damage: Math.max(1, Math.floor(damage)),
            effectiveness,
            crit,
            effectivenessText: getEffectivenessText(effectiveness),
            stab: stab > 1,
        };
    }

    canMove(cryptid) {
        if (cryptid.isFainted) return { canMove: false, reason: `${cryptid.displayName} has fainted!` };

        // Sleep check
        if (cryptid.status === 'sleep') {
            cryptid.statusTurns--;
            if (cryptid.statusTurns <= 0) {
                cryptid.status = 'none';
                return { canMove: true, message: `${cryptid.displayName} woke up!` };
            }
            return { canMove: false, reason: `${cryptid.displayName} is fast asleep...` };
        }

        // Freeze check
        if (cryptid.status === 'freeze') {
            if (chance(0.2)) {
                cryptid.status = 'none';
                return { canMove: true, message: `${cryptid.displayName} thawed out!` };
            }
            return { canMove: false, reason: `${cryptid.displayName} is frozen solid!` };
        }

        // Paralyze check
        if (cryptid.status === 'paralyze') {
            if (chance(0.25)) {
                return { canMove: false, reason: `${cryptid.displayName} is paralyzed and can't move!` };
            }
        }

        // Confusion check
        if (cryptid.status === 'confusion') {
            cryptid.statusTurns--;
            if (cryptid.statusTurns <= 0) {
                cryptid.status = 'none';
                return { canMove: true, message: `${cryptid.displayName} snapped out of confusion!` };
            }
            if (chance(0.33)) {
                // Hit self
                const selfDamage = Math.floor(((2 * cryptid.level / 5 + 2) * 40 * cryptid.getEffectiveStat('atk') / cryptid.getEffectiveStat('def')) / 50 + 2);
                cryptid.takeDamage(selfDamage);
                return { canMove: false, reason: `${cryptid.displayName} hurt itself in confusion!`, selfDamage };
            }
        }

        return { canMove: true };
    }

    applyStatusEffect(target, effect, effectChance) {
        if (target.status !== 'none' && effect !== 'confusion') return null;
        if (!chance(effectChance / 100)) return null;

        // Type immunities
        if (effect === 'burn' && target.types.includes('fire')) return null;
        if (effect === 'freeze' && target.types.includes('ice')) return null;
        if (effect === 'paralyze' && target.types.includes('electric')) return null;
        if (effect === 'poison' && target.types.includes('earth')) return null;

        target.status = effect;
        switch (effect) {
            case 'sleep': target.statusTurns = randomInt(1, 3); break;
            case 'confusion': target.statusTurns = randomInt(2, 5); break;
            default: target.statusTurns = 0;
        }

        const messages = {
            burn: `${target.displayName} was burned!`,
            paralyze: `${target.displayName} was paralyzed!`,
            sleep: `${target.displayName} fell asleep!`,
            poison: `${target.displayName} was poisoned!`,
            freeze: `${target.displayName} was frozen solid!`,
            confusion: `${target.displayName} became confused!`,
        };

        return messages[effect];
    }

    applyEndOfTurnEffects(cryptid) {
        const messages = [];
        if (cryptid.isFainted) return messages;

        if (cryptid.status === 'burn') {
            const dmg = Math.max(1, Math.floor(cryptid.maxHp / 16));
            cryptid.takeDamage(dmg);
            messages.push(`${cryptid.displayName} is hurt by its burn!`);
        }

        if (cryptid.status === 'poison') {
            const dmg = Math.max(1, Math.floor(cryptid.maxHp / 8));
            cryptid.takeDamage(dmg);
            messages.push(`${cryptid.displayName} is hurt by poison!`);
        }

        if (cryptid.leechSeeded) {
            const dmg = Math.max(1, Math.floor(cryptid.maxHp / 8));
            cryptid.takeDamage(dmg);
            messages.push(`Leech Seed saps ${cryptid.displayName}'s health!`);
        }

        return messages;
    }

    applyStatChange(target, statChange) {
        if (!statChange) return null;
        const actual = statChange.target === 'self' ? target : target;
        const stat = statChange.stat;
        const stages = statChange.stages;
        const oldStage = actual.statStages[stat];
        actual.statStages[stat] = Math.max(-6, Math.min(6, oldStage + stages));
        const diff = actual.statStages[stat] - oldStage;

        if (diff === 0) {
            return stages > 0
                ? `${actual.displayName}'s ${this.statName(stat)} won't go any higher!`
                : `${actual.displayName}'s ${this.statName(stat)} won't go any lower!`;
        }

        const magnitude = Math.abs(diff) >= 2 ? 'sharply ' : '';
        const direction = diff > 0 ? 'rose' : 'fell';
        return `${actual.displayName}'s ${this.statName(stat)} ${magnitude}${direction}!`;
    }

    statName(stat) {
        const names = { atk: 'Attack', def: 'Defense', spAtk: 'Sp. Atk', spDef: 'Sp. Def', spd: 'Speed' };
        return names[stat] || stat;
    }

    getTurnOrder(cryptidA, cryptidB, moveA, moveB) {
        const prioA = moveA?.priority || 0;
        const prioB = moveB?.priority || 0;
        if (prioA !== prioB) return prioA > prioB ? 'a' : 'b';

        const spdA = cryptidA.getEffectiveStat('spd');
        const spdB = cryptidB.getEffectiveStat('spd');
        if (spdA !== spdB) return spdA > spdB ? 'a' : 'b';
        return chance(0.5) ? 'a' : 'b';
    }

    executeMove(attacker, defender, move, moveIndex) {
        const results = {
            messages: [],
            damage: 0,
            effectiveness: 1,
            crit: false,
            fainted: false,
            statusApplied: null,
            statChanged: null,
        };

        results.messages.push(`${attacker.displayName} used ${move.name}!`);

        // Deduct PP
        if (moveIndex >= 0) {
            attacker.pp[moveIndex] = Math.max(0, attacker.pp[moveIndex] - 1);
        }

        // Accuracy check
        if (move.accuracy < 100 && !chance(move.accuracy / 100)) {
            results.messages.push(`${attacker.displayName}'s attack missed!`);
            return results;
        }

        // Damage
        if (move.power > 0) {
            const dmgResult = this.calculateDamage(attacker, defender, move);
            results.damage = dmgResult.damage;
            results.effectiveness = dmgResult.effectiveness;
            results.crit = dmgResult.crit;

            if (dmgResult.effectiveness === 0) {
                results.messages.push(dmgResult.effectivenessText);
                return results;
            }

            defender.takeDamage(dmgResult.damage);
            results.fainted = defender.isFainted;

            if (dmgResult.crit) results.messages.push('A critical hit!');
            if (dmgResult.effectivenessText) results.messages.push(dmgResult.effectivenessText);
        }

        // Status effect
        if (move.effect && move.effect !== 'none' && !defender.isFainted) {
            const statusMsg = this.applyStatusEffect(defender, move.effect, move.effectChance);
            if (statusMsg) {
                results.statusApplied = move.effect;
                results.messages.push(statusMsg);
            }
        }

        // Stat changes
        if (move.statChange && !defender.isFainted) {
            const target = move.statChange.target === 'self' ? attacker : defender;
            const statMsg = this.applyStatChange(target, move.statChange);
            if (statMsg) {
                results.statChanged = true;
                results.messages.push(statMsg);
            }
        }

        // Leech seed
        if (move.leechSeed && !defender.isFainted && !defender.leechSeeded) {
            defender.leechSeeded = true;
            results.messages.push(`${defender.displayName} was seeded!`);
        }

        // Healing
        if (move.heal === 'full') {
            attacker.hp = attacker.maxHp;
            results.messages.push(`${attacker.displayName} restored its HP!`);
        }

        // Cure status
        if (move.cureStatus) {
            attacker.status = 'none';
            attacker.statusTurns = 0;
            results.messages.push(`${attacker.displayName} was cured of its status!`);
        }

        return results;
    }

    getAIMove(cryptid, opponent) {
        // AI picks the best move
        let bestMove = 0;
        let bestScore = -1;

        for (let i = 0; i < cryptid.moves.length; i++) {
            if (cryptid.pp[i] <= 0) continue;
            const move = window.__cryptidmon_moves?.find(m => m.id === cryptid.moves[i]);
            if (!move) continue;

            let score = move.power || 0;

            // Prefer super effective
            const eff = getEffectiveness(move.type, opponent.types);
            score *= eff;

            // STAB bonus
            if (cryptid.types.includes(move.type)) score *= 1.2;

            // Status moves get moderate priority
            if (move.category === 'status') {
                score = 40;
                if (opponent.status !== 'none') score = 10; // Don't stack status
            }

            // Randomness factor
            score *= randomFloat(0.8, 1.2);

            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }

        return bestMove;
    }

    calcXpGain(winner, loser, isTrainer = false) {
        const base = 64;
        const trainerBonus = isTrainer ? 1.5 : 1;
        return Math.floor((base * loser.level * trainerBonus) / (7 * winner.level) * 10 + 10);
    }
}
