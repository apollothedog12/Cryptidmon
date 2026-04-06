export const Regions = [
    {
        id: 'pinewatch',
        name: 'Pinewatch Forest',
        description: 'A dense forest filled with ancient pines and mossy trails. Strange rustling sounds echo between the trees, and local legends speak of large, hairy figures glimpsed at dusk.',
        unlockCondition: null, // starting area
        encounterTable: [
            { cryptidId: 'sasquatch', weight: 30, minLevel: 3, maxLevel: 6 },
            { cryptidId: 'jackalkit', weight: 25, minLevel: 3, maxLevel: 7 },
            { cryptidId: 'mossling', weight: 35, minLevel: 3, maxLevel: 5 },
            { cryptidId: 'bunnyflame', weight: 20, minLevel: 4, maxLevel: 7 },
            { cryptidId: 'gustling', weight: 15, minLevel: 5, maxLevel: 8 },
            { cryptidId: 'fairyfly', weight: 10, minLevel: 6, maxLevel: 9 },
            { cryptidId: 'boggart', weight: 5, minLevel: 7, maxLevel: 10 },
        ],
        bgColor: '#2d5a27',
    },
    {
        id: 'appalachia',
        name: 'Appalachian Hollows',
        description: 'Mist-shrouded hollows wind through ancient mountains. Abandoned coal towns dot the landscape, and eerie lights flicker in the fog. The locals whisper about the Mothman.',
        unlockCondition: { badge: 'pinewatch_badge' },
        encounterTable: [
            { cryptidId: 'mothling', weight: 30, minLevel: 8, maxLevel: 12 },
            { cryptidId: 'springheel', weight: 25, minLevel: 9, maxLevel: 14 },
            { cryptidId: 'ashimp', weight: 20, minLevel: 10, maxLevel: 15 },
            { cryptidId: 'nightowl', weight: 15, minLevel: 11, maxLevel: 16 },
            { cryptidId: 'bunnyflame', weight: 10, minLevel: 12, maxLevel: 17 },
            { cryptidId: 'vinecrawl', weight: 8, minLevel: 13, maxLevel: 18 },
        ],
        bgColor: '#3a3a52',
    },
    {
        id: 'greatplains',
        name: 'Great Plains',
        description: 'Endless grasslands stretch to the horizon under vast, thunderous skies. Dust devils dance across the prairie, and strange antlered creatures bound through the wheat.',
        unlockCondition: { badge: 'appalachia_badge' },
        encounterTable: [
            { cryptidId: 'thunderkit', weight: 30, minLevel: 12, maxLevel: 16 },
            { cryptidId: 'jackalope', weight: 25, minLevel: 13, maxLevel: 18 },
            { cryptidId: 'gustling', weight: 20, minLevel: 14, maxLevel: 19 },
            { cryptidId: 'dustdevil', weight: 15, minLevel: 15, maxLevel: 20 },
            { cryptidId: 'sparkpix', weight: 10, minLevel: 16, maxLevel: 21 },
            { cryptidId: 'wolpertinger', weight: 8, minLevel: 17, maxLevel: 22 },
        ],
        bgColor: '#8a7d3b',
    },
    {
        id: 'southwest',
        name: 'Southwest Desert',
        description: 'A scorching desert of red rock canyons and endless sand. Ancient petroglyphs hint at creatures older than memory, and something stalks the livestock by night.',
        unlockCondition: { badge: 'greatplains_badge' },
        encounterTable: [
            { cryptidId: 'chupacub', weight: 30, minLevel: 18, maxLevel: 22 },
            { cryptidId: 'sandskitter', weight: 25, minLevel: 19, maxLevel: 24 },
            { cryptidId: 'skinpup', weight: 20, minLevel: 20, maxLevel: 25 },
            { cryptidId: 'ashfiend', weight: 15, minLevel: 21, maxLevel: 26 },
            { cryptidId: 'chupacabra', weight: 8, minLevel: 23, maxLevel: 28 },
            { cryptidId: 'scorpius', weight: 10, minLevel: 22, maxLevel: 27 },
        ],
        bgColor: '#b5651d',
    },
    {
        id: 'mistyloch',
        name: 'Misty Loch',
        description: 'A vast, fog-covered lake surrounded by emerald hills and crumbling stone ruins. Strange shapes glide beneath the surface, and faerie lights drift over the water at night.',
        unlockCondition: { badge: 'southwest_badge' },
        encounterTable: [
            { cryptidId: 'nessling', weight: 30, minLevel: 22, maxLevel: 26 },
            { cryptidId: 'tidepup', weight: 25, minLevel: 23, maxLevel: 27 },
            { cryptidId: 'fairyfly', weight: 20, minLevel: 24, maxLevel: 28 },
            { cryptidId: 'stormeel', weight: 15, minLevel: 25, maxLevel: 30 },
            { cryptidId: 'bogwitch', weight: 10, minLevel: 26, maxLevel: 31 },
            { cryptidId: 'faerielight', weight: 8, minLevel: 27, maxLevel: 31 },
            { cryptidId: 'nessie', weight: 5, minLevel: 28, maxLevel: 32 },
        ],
        bgColor: '#2a6478',
    },
    {
        id: 'frozenpeak',
        name: 'Frozen Peaks',
        description: 'Towering mountains cloaked in eternal snow and howling winds. Ice caves glitter with strange crystals, and massive footprints trail off into the blizzard. Only the strongest trainers dare venture here.',
        unlockCondition: { badge: 'mistyloch_badge' },
        encounterTable: [
            { cryptidId: 'yetling', weight: 30, minLevel: 28, maxLevel: 32 },
            { cryptidId: 'wendling', weight: 25, minLevel: 29, maxLevel: 34 },
            { cryptidId: 'crystalpup', weight: 20, minLevel: 30, maxLevel: 35 },
            { cryptidId: 'frostfang', weight: 15, minLevel: 31, maxLevel: 36 },
            { cryptidId: 'tidepup', weight: 10, minLevel: 32, maxLevel: 37 },
            { cryptidId: 'yeti', weight: 7, minLevel: 34, maxLevel: 39 },
            { cryptidId: 'frostwolf', weight: 5, minLevel: 35, maxLevel: 40 },
        ],
        bgColor: '#a8c8d8',
    },
];

export function getRegion(id) {
    return Regions.find(r => r.id === id);
}

export function getEncounterForRegion(regionId) {
    const region = getRegion(regionId);
    if (!region) return null;

    const table = region.encounterTable;
    const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const entry of table) {
        roll -= entry.weight;
        if (roll <= 0) {
            const level = Math.floor(
                Math.random() * (entry.maxLevel - entry.minLevel + 1) + entry.minLevel
            );
            return { cryptidId: entry.cryptidId, level };
        }
    }

    // Fallback to first entry
    const fallback = table[0];
    return { cryptidId: fallback.cryptidId, level: fallback.minLevel };
}
