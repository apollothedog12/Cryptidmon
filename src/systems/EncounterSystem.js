import { ENCOUNTER_RATE } from '../utils/constants.js';
import { chance, weightedRandom, randomInt } from '../utils/math.js';
import { Cryptid } from '../entities/Cryptid.js';

export class EncounterSystem {
    constructor(regions, cryptidTemplates) {
        this.regions = regions;
        this.templates = cryptidTemplates;
    }

    checkEncounter(regionId, tileType) {
        // Only encounter in tall grass (type 2)
        if (tileType !== 2) return null;
        if (!chance(ENCOUNTER_RATE)) return null;

        const region = this.regions.find(r => r.id === regionId);
        if (!region || !region.encounterTable?.length) return null;

        // Weighted random selection
        const entry = weightedRandom(
            region.encounterTable.map(e => ({ value: e, weight: e.weight }))
        );

        if (!entry) return null;

        const template = this.templates.find(t => t.id === entry.cryptidId);
        if (!template) return null;

        const level = randomInt(entry.minLevel, entry.maxLevel);
        const wildCryptid = new Cryptid(template, level);
        wildCryptid.isWild = true;

        return wildCryptid;
    }

    getRegionEncounters(regionId) {
        const region = this.regions.find(r => r.id === regionId);
        return region?.encounterTable || [];
    }
}
