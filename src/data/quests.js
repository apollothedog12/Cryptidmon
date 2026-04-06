export const Quests = [
    // =========================================================================
    // MAIN QUESTS — A single chain through all 6 regions
    // =========================================================================

    // --- Pinewatch Forest ---
    {
        id: 'main_1',
        name: 'The Journey Begins',
        type: 'main',
        region: 'pinewatch',
        description: 'Meet Professor Cypress in Pinewatch Forest and receive your first Cryptid partner.',
        objectives: [
            { type: 'talk', target: 'prof_cypress', description: 'Talk to Professor Cypress', completed: false },
            { type: 'collect_item', target: 'cryptidex', count: 1, description: 'Receive the Cryptidex', completed: false },
            { type: 'catch', target: 'any', count: 1, description: 'Catch your first wild Cryptid', completed: false },
        ],
        rewards: { gold: 500, items: ['potion', 'potion', 'potion'], xp: 100 },
        prerequisite: null,
        nextQuest: 'main_2',
    },
    {
        id: 'main_2',
        name: 'First Steps',
        type: 'main',
        region: 'pinewatch',
        description: 'Prove yourself by defeating two trainers in Pinewatch Forest.',
        objectives: [
            { type: 'defeat_trainer', target: 'trainer_scout_amy', description: 'Defeat Scout Amy', completed: false },
            { type: 'defeat_trainer', target: 'trainer_hiker_bob', description: 'Defeat Hiker Bob', completed: false },
            { type: 'talk', target: 'prof_cypress', description: 'Report back to Professor Cypress', completed: false },
        ],
        rewards: { gold: 800, items: ['great_trap', 'super_potion'], xp: 200 },
        prerequisite: 'main_1',
        nextQuest: 'main_3',
    },

    // --- Appalachian Hollows ---
    {
        id: 'main_3',
        name: 'Into the Hollows',
        type: 'main',
        region: 'appalachia',
        description: 'Travel to the Appalachian Hollows and investigate reports of Mothman sightings near the abandoned mines.',
        objectives: [
            { type: 'reach_location', target: 'appalachia', description: 'Travel to the Appalachian Hollows', completed: false },
            { type: 'talk', target: 'trainer_ranger_cole', description: 'Speak with Ranger Cole about the sightings', completed: false },
            { type: 'catch', target: 'mothling', count: 1, description: 'Catch a Mothling for research', completed: false },
            { type: 'defeat_trainer', target: 'trainer_spelunker_dan', description: 'Defeat Spelunker Dan blocking the cave', completed: false },
        ],
        rewards: { gold: 1200, items: ['super_potion', 'super_potion', 'antidote'], xp: 350 },
        prerequisite: 'main_2',
        nextQuest: 'main_4',
    },
    {
        id: 'main_4',
        name: 'The Hollow Keeper',
        type: 'main',
        region: 'appalachia',
        description: 'Challenge the Hollow Keeper, the ancient guardian of the Appalachian mountains, and earn the right to pass beyond.',
        objectives: [
            { type: 'defeat_trainer', target: 'trainer_mystic_vera', description: 'Defeat Mystic Vera', completed: false },
            { type: 'defeat_boss', target: 'boss_hollow_keeper', description: 'Defeat the Hollow Keeper', completed: false },
            { type: 'collect_item', target: 'appalachia_badge', count: 1, description: 'Earn the Appalachia Badge', completed: false },
        ],
        rewards: { gold: 2500, items: ['great_trap', 'great_trap', 'hyper_potion'], xp: 500 },
        prerequisite: 'main_3',
        nextQuest: 'main_5',
    },

    // --- Great Plains ---
    {
        id: 'main_5',
        name: 'Thunder on the Plains',
        type: 'main',
        region: 'greatplains',
        description: 'Cross the Great Plains in search of the legendary Thunderbird\'s nesting grounds. Storms rage overhead as you draw closer.',
        objectives: [
            { type: 'reach_location', target: 'greatplains', description: 'Travel to the Great Plains', completed: false },
            { type: 'defeat_trainer', target: 'trainer_cowgirl_jessie', description: 'Defeat Cowgirl Jessie', completed: false },
            { type: 'defeat_trainer', target: 'trainer_storm_chaser_rick', description: 'Defeat Storm Chaser Rick', completed: false },
            { type: 'catch', target: 'thunderkit', count: 1, description: 'Catch a Thunderkit near the nest', completed: false },
        ],
        rewards: { gold: 2000, items: ['ultra_trap', 'hyper_potion', 'full_heal'], xp: 600 },
        prerequisite: 'main_4',
        nextQuest: 'main_6',
    },
    {
        id: 'main_6',
        name: 'Storm Warden\'s Trial',
        type: 'main',
        region: 'greatplains',
        description: 'The Storm Warden commands the winds of the plains. Defeat this powerful guardian to prove your strength.',
        objectives: [
            { type: 'defeat_trainer', target: 'trainer_rancher_will', description: 'Defeat Rancher Will', completed: false },
            { type: 'defeat_boss', target: 'boss_storm_warden', description: 'Defeat the Storm Warden', completed: false },
            { type: 'collect_item', target: 'greatplains_badge', count: 1, description: 'Earn the Great Plains Badge', completed: false },
        ],
        rewards: { gold: 4000, items: ['ultra_trap', 'ultra_trap', 'max_potion'], xp: 800 },
        prerequisite: 'main_5',
        nextQuest: 'main_7',
    },

    // --- Southwest Desert ---
    {
        id: 'main_7',
        name: 'Desert Mysteries',
        type: 'main',
        region: 'southwest',
        description: 'Ranchers in the Southwest Desert report Chupacabra attacks on their livestock. Investigate the disturbances and track the creatures to their lair.',
        objectives: [
            { type: 'reach_location', target: 'southwest', description: 'Travel to the Southwest Desert', completed: false },
            { type: 'talk', target: 'trainer_prospector_sal', description: 'Talk to Prospector Sal about the attacks', completed: false },
            { type: 'catch', target: 'chupacub', count: 1, description: 'Catch a Chupacub for study', completed: false },
            { type: 'defeat_trainer', target: 'trainer_shaman_kai', description: 'Defeat Shaman Kai guarding the canyon pass', completed: false },
        ],
        rewards: { gold: 3000, items: ['shadow_trap', 'hyper_potion', 'hyper_potion'], xp: 900 },
        prerequisite: 'main_6',
        nextQuest: 'main_8',
    },
    {
        id: 'main_8',
        name: 'Shadow of the Desert',
        type: 'main',
        region: 'southwest',
        description: 'Defeat the Desert Shade and uncover evidence of a shadowy organization called "The Veil" that seeks to control powerful Cryptids.',
        objectives: [
            { type: 'defeat_trainer', target: 'trainer_drifter_maya', description: 'Defeat Drifter Maya', completed: false },
            { type: 'defeat_boss', target: 'boss_desert_shade', description: 'Defeat the Desert Shade', completed: false },
            { type: 'collect_item', target: 'veil_orders', count: 1, description: 'Recover The Veil\'s secret orders', completed: false },
            { type: 'collect_item', target: 'southwest_badge', count: 1, description: 'Earn the Southwest Badge', completed: false },
        ],
        rewards: { gold: 5500, items: ['ultra_trap', 'max_potion', 'revive'], xp: 1100 },
        prerequisite: 'main_7',
        nextQuest: 'main_9',
    },

    // --- Misty Loch ---
    {
        id: 'main_9',
        name: 'Loch Secrets',
        type: 'main',
        region: 'mistyloch',
        description: 'Search the fog-covered Misty Loch for signs of Nessie. Discover that The Veil plans to capture legendary Cryptids and harness their power.',
        objectives: [
            { type: 'reach_location', target: 'mistyloch', description: 'Travel to the Misty Loch', completed: false },
            { type: 'talk', target: 'trainer_fisher_angus', description: 'Ask Fisher Angus about Nessie sightings', completed: false },
            { type: 'defeat_trainer', target: 'trainer_witch_moira', description: 'Defeat Hedge Witch Moira to access the ruins', completed: false },
            { type: 'collect_item', target: 'veil_blueprint', count: 1, description: 'Find The Veil\'s capture device blueprint in the ruins', completed: false },
        ],
        rewards: { gold: 5000, items: ['aqua_trap', 'aqua_trap', 'max_potion'], xp: 1200 },
        prerequisite: 'main_8',
        nextQuest: 'main_10',
    },
    {
        id: 'main_10',
        name: 'Guardian of the Deep',
        type: 'main',
        region: 'mistyloch',
        description: 'Challenge the Loch Guardian, protector of the deep waters. Learn the locations of the legendary Cryptids before The Veil reaches them.',
        objectives: [
            { type: 'defeat_trainer', target: 'trainer_diver_finn', description: 'Defeat Diver Finn', completed: false },
            { type: 'defeat_boss', target: 'boss_loch_guardian', description: 'Defeat the Loch Guardian', completed: false },
            { type: 'collect_item', target: 'legendary_map', count: 1, description: 'Receive the map of legendary locations', completed: false },
            { type: 'collect_item', target: 'mistyloch_badge', count: 1, description: 'Earn the Misty Loch Badge', completed: false },
        ],
        rewards: { gold: 7500, items: ['ultra_trap', 'full_revive', 'max_potion'], xp: 1400 },
        prerequisite: 'main_9',
        nextQuest: 'main_11',
    },

    // --- Frozen Peaks ---
    {
        id: 'main_11',
        name: 'Ascent to the Peak',
        type: 'main',
        region: 'frozenpeak',
        description: 'Climb the treacherous Frozen Peaks and confront The Veil\'s operatives. Their leader awaits at the summit with a plan to enslave the legendaries.',
        objectives: [
            { type: 'reach_location', target: 'frozenpeak', description: 'Travel to the Frozen Peaks', completed: false },
            { type: 'defeat_trainer', target: 'trainer_mountaineer_sven', description: 'Defeat Mountaineer Sven', completed: false },
            { type: 'defeat_trainer', target: 'trainer_ice_witch_elsa', description: 'Defeat Ice Witch Elsa, a Veil operative', completed: false },
            { type: 'defeat_trainer', target: 'trainer_sherpa_tenzing', description: 'Defeat Sherpa Tenzing to reach the summit', completed: false },
        ],
        rewards: { gold: 6000, items: ['max_potion', 'max_potion', 'full_revive'], xp: 1600 },
        prerequisite: 'main_10',
        nextQuest: 'main_12',
    },
    {
        id: 'main_12',
        name: 'The Frost Sovereign',
        type: 'main',
        region: 'frozenpeak',
        description: 'The Veil\'s leader has merged with the power of the Frost Sovereign. Defeat them in the ultimate battle to save the legendary Cryptids and restore balance to the world.',
        objectives: [
            { type: 'defeat_boss', target: 'boss_frost_sovereign', description: 'Defeat the Frost Sovereign', completed: false },
            { type: 'collect_item', target: 'frozenpeak_badge', count: 1, description: 'Earn the Frozen Peaks Badge', completed: false },
        ],
        rewards: { gold: 15000, items: ['master_trap', 'full_revive', 'full_revive', 'full_revive'], xp: 3000 },
        prerequisite: 'main_11',
        nextQuest: null,
    },

    // =========================================================================
    // SIDE QUESTS — 2-3 per region, 15 total
    // =========================================================================

    // --- Pinewatch Forest Side Quests ---
    {
        id: 'side_pw_1',
        name: 'Old Pete\'s Lost Lantern',
        type: 'side',
        region: 'pinewatch',
        description: 'Old Pete lost his lucky lantern somewhere deep in the forest. Search the tall grass to find it.',
        objectives: [
            { type: 'talk', target: 'quest_old_pete', description: 'Talk to Old Pete', completed: false },
            { type: 'collect_item', target: 'old_lantern', count: 1, description: 'Find the lost lantern in the tall grass', completed: false },
            { type: 'talk', target: 'quest_old_pete', description: 'Return the lantern to Old Pete', completed: false },
        ],
        rewards: { gold: 300, items: ['great_trap', 'great_trap', 'great_trap', 'great_trap', 'great_trap'], xp: 150 },
        prerequisite: 'main_1',
        nextQuest: null,
    },
    {
        id: 'side_pw_2',
        name: 'Flora Collector',
        type: 'side',
        region: 'pinewatch',
        description: 'Professor Cypress needs samples of Flora-type Cryptids for research. Catch 3 different Flora types in Pinewatch.',
        objectives: [
            { type: 'talk', target: 'prof_cypress', description: 'Talk to Professor Cypress about Flora research', completed: false },
            { type: 'catch_type', target: 'flora', count: 3, description: 'Catch 3 Flora-type Cryptids', completed: false },
            { type: 'talk', target: 'prof_cypress', description: 'Show the Flora Cryptids to Professor Cypress', completed: false },
        ],
        rewards: { gold: 600, items: ['moonstone'], xp: 250 },
        prerequisite: 'main_1',
        nextQuest: null,
    },
    {
        id: 'side_pw_3',
        name: 'The Shy Sasquatch',
        type: 'side',
        region: 'pinewatch',
        description: 'A rare Sasquatch has been spotted in the deepest part of Pinewatch Forest. Track it down and catch it.',
        objectives: [
            { type: 'talk', target: 'trainer_hiker_bob', description: 'Ask Hiker Bob about Sasquatch sightings', completed: false },
            { type: 'catch', target: 'sasquatch', count: 1, description: 'Catch a Sasquatch', completed: false },
        ],
        rewards: { gold: 400, items: ['super_potion', 'super_potion'], xp: 200 },
        prerequisite: 'main_1',
        nextQuest: null,
    },

    // --- Appalachian Hollows Side Quests ---
    {
        id: 'side_ap_1',
        name: 'Medicine Run',
        type: 'side',
        region: 'appalachia',
        description: 'Nurse Hollowell is running low on healing herbs. Deliver a batch of medicine from Shopkeeper Martha before it\'s too late.',
        objectives: [
            { type: 'talk', target: 'nurse_hollowell', description: 'Talk to Nurse Hollowell about her supply shortage', completed: false },
            { type: 'talk', target: 'shop_martha', description: 'Pick up the medicine from Shopkeeper Martha', completed: false },
            { type: 'collect_item', target: 'herb_medicine', count: 1, description: 'Collect the herbal medicine package', completed: false },
            { type: 'talk', target: 'nurse_hollowell', description: 'Deliver the medicine to Nurse Hollowell', completed: false },
        ],
        rewards: { gold: 800, items: ['hyper_potion', 'hyper_potion', 'full_heal'], xp: 300 },
        prerequisite: 'main_3',
        nextQuest: null,
    },
    {
        id: 'side_ap_2',
        name: 'Echoes in the Dark',
        type: 'side',
        region: 'appalachia',
        description: 'Spelunker Dan heard strange echoes deep in the mine. Investigate and defeat the Shadow-type Cryptids lurking inside.',
        objectives: [
            { type: 'talk', target: 'trainer_spelunker_dan', description: 'Talk to Spelunker Dan about the echoes', completed: false },
            { type: 'catch_type', target: 'shadow', count: 2, description: 'Catch 2 Shadow-type Cryptids in the mines', completed: false },
            { type: 'talk', target: 'trainer_spelunker_dan', description: 'Report back to Spelunker Dan', completed: false },
        ],
        rewards: { gold: 1000, items: ['shadow_trap', 'shadowgem'], xp: 400 },
        prerequisite: 'main_3',
        nextQuest: null,
    },

    // --- Great Plains Side Quests ---
    {
        id: 'side_gp_1',
        name: 'The Lost Hiker',
        type: 'side',
        region: 'greatplains',
        description: 'A hiker has gone missing on the open plains during a storm. Find them and guide them back to safety.',
        objectives: [
            { type: 'talk', target: 'trainer_rancher_will', description: 'Talk to Rancher Will about the missing hiker', completed: false },
            { type: 'reach_location', target: 'plains_storm_field', description: 'Search the storm field for the lost hiker', completed: false },
            { type: 'defeat_trainer', target: 'trainer_storm_chaser_rick', description: 'Clear the wild Cryptids blocking the path', completed: false },
            { type: 'collect_item', target: 'lost_hiker_found', count: 1, description: 'Find and rescue the lost hiker', completed: false },
        ],
        rewards: { gold: 1500, items: ['hyper_potion', 'revive', 'full_heal'], xp: 500 },
        prerequisite: 'main_5',
        nextQuest: null,
    },
    {
        id: 'side_gp_2',
        name: 'Prairie Lightning Rod',
        type: 'side',
        region: 'greatplains',
        description: 'Storm Chaser Rick wants to study Electric-type Cryptids. Help him by catching a few on the electrified plains.',
        objectives: [
            { type: 'talk', target: 'trainer_storm_chaser_rick', description: 'Talk to Storm Chaser Rick', completed: false },
            { type: 'catch_type', target: 'electric', count: 3, description: 'Catch 3 Electric-type Cryptids', completed: false },
            { type: 'talk', target: 'trainer_storm_chaser_rick', description: 'Show the Electric Cryptids to Rick', completed: false },
        ],
        rewards: { gold: 1200, items: ['lightcrystal'], xp: 450 },
        prerequisite: 'main_5',
        nextQuest: null,
    },
    {
        id: 'side_gp_3',
        name: 'Rancher\'s Challenge',
        type: 'side',
        region: 'greatplains',
        description: 'Rancher Will wants to see if your Cryptids can handle the tough creatures of the plains. Defeat all three plains trainers.',
        objectives: [
            { type: 'defeat_trainer', target: 'trainer_cowgirl_jessie', description: 'Defeat Cowgirl Jessie', completed: false },
            { type: 'defeat_trainer', target: 'trainer_storm_chaser_rick', description: 'Defeat Storm Chaser Rick', completed: false },
            { type: 'defeat_trainer', target: 'trainer_rancher_will', description: 'Defeat Rancher Will', completed: false },
        ],
        rewards: { gold: 2000, items: ['ultra_trap', 'ultra_trap', 'attack_boost'], xp: 550 },
        prerequisite: 'main_5',
        nextQuest: null,
    },

    // --- Southwest Desert Side Quests ---
    {
        id: 'side_sw_1',
        name: 'Cactus Carl\'s Delivery',
        type: 'side',
        region: 'southwest',
        description: 'Cactus Carl needs someone to deliver a supply crate to Shaman Kai in the deep canyon. The path is dangerous.',
        objectives: [
            { type: 'talk', target: 'shop_cactus_carl', description: 'Talk to Cactus Carl about the delivery', completed: false },
            { type: 'collect_item', target: 'supply_crate', count: 1, description: 'Pick up the supply crate', completed: false },
            { type: 'talk', target: 'trainer_shaman_kai', description: 'Deliver the crate to Shaman Kai', completed: false },
        ],
        rewards: { gold: 1800, items: ['max_potion', 'full_heal'], xp: 600 },
        prerequisite: 'main_7',
        nextQuest: null,
    },
    {
        id: 'side_sw_2',
        name: 'Chupacabra Hunt',
        type: 'side',
        region: 'southwest',
        description: 'Prospector Sal has put up a bounty for anyone who can catch the Chupacabra terrorizing the local ranches.',
        objectives: [
            { type: 'talk', target: 'trainer_prospector_sal', description: 'Talk to Prospector Sal about the bounty', completed: false },
            { type: 'catch', target: 'chupacabra', count: 1, description: 'Catch the elusive Chupacabra', completed: false },
            { type: 'talk', target: 'trainer_prospector_sal', description: 'Claim the bounty from Prospector Sal', completed: false },
        ],
        rewards: { gold: 3000, items: ['ultra_trap', 'ultra_trap', 'ultra_trap'], xp: 700 },
        prerequisite: 'main_7',
        nextQuest: null,
    },
    {
        id: 'side_sw_3',
        name: 'Petroglyphs of Power',
        type: 'side',
        region: 'southwest',
        description: 'Shaman Kai believes ancient petroglyphs hold the key to strengthening Cryptid bonds. Find the three hidden petroglyphs in the canyon.',
        objectives: [
            { type: 'talk', target: 'trainer_shaman_kai', description: 'Talk to Shaman Kai about the petroglyphs', completed: false },
            { type: 'collect_item', target: 'petroglyph_rubbing_1', count: 1, description: 'Find the first petroglyph rubbing', completed: false },
            { type: 'collect_item', target: 'petroglyph_rubbing_2', count: 1, description: 'Find the second petroglyph rubbing', completed: false },
            { type: 'collect_item', target: 'petroglyph_rubbing_3', count: 1, description: 'Find the third petroglyph rubbing', completed: false },
            { type: 'talk', target: 'trainer_shaman_kai', description: 'Return the rubbings to Shaman Kai', completed: false },
        ],
        rewards: { gold: 2500, items: ['attack_boost', 'defense_boost', 'speed_boost'], xp: 800 },
        prerequisite: 'main_7',
        nextQuest: null,
    },

    // --- Misty Loch Side Quests ---
    {
        id: 'side_ml_1',
        name: 'The Faerie Ring',
        type: 'side',
        region: 'mistyloch',
        description: 'Hedge Witch Moira senses a disturbance in the faerie ring near the loch. Catch Spirit-type Cryptids to restore the balance.',
        objectives: [
            { type: 'talk', target: 'trainer_witch_moira', description: 'Talk to Hedge Witch Moira about the faerie ring', completed: false },
            { type: 'catch_type', target: 'spirit', count: 3, description: 'Catch 3 Spirit-type Cryptids near the ring', completed: false },
            { type: 'talk', target: 'trainer_witch_moira', description: 'Return to Hedge Witch Moira', completed: false },
        ],
        rewards: { gold: 3500, items: ['moonstone', 'shadowgem'], xp: 900 },
        prerequisite: 'main_9',
        nextQuest: null,
    },
    {
        id: 'side_ml_2',
        name: 'Deep Dive',
        type: 'side',
        region: 'mistyloch',
        description: 'Diver Finn has discovered sunken ruins beneath the loch. Help him explore by defeating the Cryptids guarding the entrance.',
        objectives: [
            { type: 'talk', target: 'trainer_diver_finn', description: 'Talk to Diver Finn about the sunken ruins', completed: false },
            { type: 'catch_type', target: 'aquatic', count: 2, description: 'Catch 2 Aquatic-type Cryptids in the deep loch', completed: false },
            { type: 'collect_item', target: 'sunken_relic', count: 1, description: 'Recover the sunken relic from the ruins', completed: false },
            { type: 'talk', target: 'trainer_diver_finn', description: 'Bring the relic to Diver Finn', completed: false },
        ],
        rewards: { gold: 4000, items: ['aqua_trap', 'max_potion', 'full_revive'], xp: 1000 },
        prerequisite: 'main_9',
        nextQuest: null,
    },

    // --- Frozen Peaks Side Quests ---
    {
        id: 'side_fp_1',
        name: 'Yeti Tracks',
        type: 'side',
        region: 'frozenpeak',
        description: 'Mountaineer Sven found massive footprints in the snow. Track down and catch the rare Yeti before the trail goes cold.',
        objectives: [
            { type: 'talk', target: 'trainer_mountaineer_sven', description: 'Talk to Mountaineer Sven about the tracks', completed: false },
            { type: 'reach_location', target: 'yeti_cave', description: 'Follow the tracks to the yeti cave', completed: false },
            { type: 'catch', target: 'yeti', count: 1, description: 'Catch the rare Yeti', completed: false },
            { type: 'talk', target: 'trainer_mountaineer_sven', description: 'Show the Yeti to Mountaineer Sven', completed: false },
        ],
        rewards: { gold: 5000, items: ['master_trap'], xp: 1500 },
        prerequisite: 'main_11',
        nextQuest: null,
    },
    {
        id: 'side_fp_2',
        name: 'Ice Crystal Collection',
        type: 'side',
        region: 'frozenpeak',
        description: 'Shopkeeper Frostbeard needs rare ice crystals from the peak caves to craft powerful items. Gather them from Ice-type Cryptids.',
        objectives: [
            { type: 'talk', target: 'shop_frostbeard', description: 'Talk to Shopkeeper Frostbeard', completed: false },
            { type: 'catch_type', target: 'ice', count: 3, description: 'Catch 3 Ice-type Cryptids carrying crystals', completed: false },
            { type: 'collect_item', target: 'ice_crystal', count: 5, description: 'Collect 5 ice crystals', completed: false },
            { type: 'talk', target: 'shop_frostbeard', description: 'Deliver the crystals to Frostbeard', completed: false },
        ],
        rewards: { gold: 4500, items: ['lightcrystal', 'max_potion', 'max_potion'], xp: 1300 },
        prerequisite: 'main_11',
        nextQuest: null,
    },
];

/**
 * Find a quest by its unique ID.
 * @param {string} id - The quest ID (e.g. 'main_1', 'side_pw_1')
 * @returns {object|undefined} The quest object, or undefined if not found.
 */
export function getQuest(id) {
    return Quests.find(q => q.id === id);
}

/**
 * Get all quests that take place in a given region.
 * @param {string} region - The region ID (e.g. 'pinewatch', 'appalachia')
 * @returns {object[]} Array of quest objects for that region.
 */
export function getQuestsForRegion(region) {
    return Quests.filter(q => q.region === region);
}

/**
 * Get all main-story quests in order.
 * @returns {object[]} Array of main quests sorted by their chain order.
 */
export function getMainQuests() {
    return Quests.filter(q => q.type === 'main');
}

/**
 * Get all side quests, optionally filtered by region.
 * @param {string} [region] - Optional region ID to filter by.
 * @returns {object[]} Array of side quest objects.
 */
export function getSideQuests(region) {
    const sides = Quests.filter(q => q.type === 'side');
    if (region) {
        return sides.filter(q => q.region === region);
    }
    return sides;
}

/**
 * Get all quests that are available given a set of completed quest IDs.
 * A quest is available if its prerequisite is met and it hasn't been completed yet.
 * @param {Set<string>|string[]} completedQuestIds - Set or array of completed quest IDs.
 * @returns {object[]} Array of available quest objects.
 */
export function getAvailableQuests(completedQuestIds) {
    const completed = completedQuestIds instanceof Set
        ? completedQuestIds
        : new Set(completedQuestIds);

    return Quests.filter(q => {
        if (completed.has(q.id)) return false;
        if (q.prerequisite === null) return true;
        return completed.has(q.prerequisite);
    });
}
