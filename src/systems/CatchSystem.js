import { chance, randomInt } from '../utils/math.js';

export class CatchSystem {
    calculateCatchRate(cryptid, trapItem) {
        const hpFactor = (3 * cryptid.maxHp - 2 * cryptid.hp) / (3 * cryptid.maxHp);
        const trapModifier = trapItem.catchModifier || 1;

        // Master trap always catches
        if (trapModifier >= 255) return { rate: 1, shakes: 3 };

        // Type bonus traps
        let typeBonus = 1;
        if (trapItem.bonusTypes) {
            for (const t of trapItem.bonusTypes) {
                if (cryptid.types.includes(t)) {
                    typeBonus = 2;
                    break;
                }
            }
        }

        // Status bonus
        let statusBonus = 1;
        if (cryptid.status === 'sleep' || cryptid.status === 'freeze') statusBonus = 2;
        else if (cryptid.status === 'paralyze' || cryptid.status === 'burn' || cryptid.status === 'poison') statusBonus = 1.5;

        // Rarity modifier (higher level = harder to catch)
        const levelPenalty = Math.max(0.3, 1 - (cryptid.level / 80));

        const rate = Math.min(0.95, hpFactor * trapModifier * typeBonus * statusBonus * levelPenalty * 0.5);

        // Number of shakes (1-3, more shakes = closer to catching)
        const shakes = rate >= Math.random() ? 3 : randomInt(0, 2);

        return { rate, shakes, caught: shakes === 3 };
    }

    attemptCatch(cryptid, trapItem) {
        const result = this.calculateCatchRate(cryptid, trapItem);
        return {
            caught: result.caught,
            shakes: result.shakes,
            rate: result.rate,
        };
    }
}
