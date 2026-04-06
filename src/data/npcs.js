export const NPCs = {
    pinewatch: [
        {
            id: 'prof_cypress',
            name: 'Professor Cypress',
            role: 'professor',
            x: 5, y: 3,
            sprite: '#4488cc',
            dialogue: [
                'Welcome to the world of Cryptidmon!',
                'I study mysterious creatures called Cryptids.',
                'They roam the wild places of our world, hidden from most people.',
                'Choose your first partner, and begin your journey!',
            ],
            givesItem: 'cryptidex',
            givesStarter: true,
        },
        {
            id: 'nurse_pine',
            name: 'Nurse Pine',
            role: 'healer',
            x: 10, y: 4,
            sprite: '#ee6699',
            dialogue: [
                'Welcome to the Pinewatch Healing Lodge!',
                'I\'ll take care of your Cryptids. Just a moment...',
                'Your Cryptids are fully healed! Good luck out there!',
            ],
        },
        {
            id: 'shop_woodrow',
            name: 'Shopkeeper Woodrow',
            role: 'shopkeeper',
            x: 14, y: 4,
            sprite: '#88aa44',
            dialogue: [
                'Welcome to Woodrow\'s Supply Shop!',
                'Heading into the forest? You\'ll need supplies.',
            ],
            inventory: ['basic_trap', 'potion', 'antidote'],
        },
        {
            id: 'trainer_scout_amy',
            name: 'Scout Amy',
            role: 'trainer',
            x: 12, y: 10,
            sprite: '#cc8844',
            dialogue: [
                'I just started training too! Let\'s battle!',
            ],
            team: [
                { cryptidId: 'mossling', level: 4 },
                { cryptidId: 'gustling', level: 3 },
            ],
            reward: 200,
        },
        {
            id: 'trainer_hiker_bob',
            name: 'Hiker Bob',
            role: 'trainer',
            x: 22, y: 14,
            sprite: '#886644',
            dialogue: [
                'I\'ve been hiking these woods for years. Think you can beat me?',
            ],
            team: [
                { cryptidId: 'sasquatch', level: 6 },
                { cryptidId: 'jackalkit', level: 5 },
            ],
            reward: 350,
        },
        {
            id: 'quest_old_pete',
            name: 'Old Pete',
            role: 'questgiver',
            x: 8, y: 8,
            sprite: '#997755',
            dialogue: [
                'I lost my lucky lantern deep in the forest...',
                'If you find it, I\'ll give you something special!',
            ],
            quest: {
                id: 'lost_lantern',
                objective: 'Find Old Pete\'s Lantern in the tall grass',
                reward: { item: 'great_trap', quantity: 5 },
            },
        },
    ],

    appalachia: [
        {
            id: 'trainer_spelunker_dan',
            name: 'Spelunker Dan',
            role: 'trainer',
            x: 8, y: 8,
            sprite: '#776655',
            dialogue: [
                'These caves are full of surprises. So am I!',
            ],
            team: [
                { cryptidId: 'mothling', level: 10 },
                { cryptidId: 'ashimp', level: 11 },
            ],
            reward: 500,
        },
        {
            id: 'trainer_mystic_vera',
            name: 'Mystic Vera',
            role: 'trainer',
            x: 18, y: 6,
            sprite: '#9944aa',
            dialogue: [
                'I foresaw your arrival... and your defeat.',
            ],
            team: [
                { cryptidId: 'nightowl', level: 12 },
                { cryptidId: 'springheel', level: 13 },
            ],
            reward: 600,
        },
        {
            id: 'trainer_ranger_cole',
            name: 'Ranger Cole',
            role: 'trainer',
            x: 24, y: 12,
            sprite: '#447744',
            dialogue: [
                'These mountains are my territory. Prove yourself!',
            ],
            team: [
                { cryptidId: 'vinecrawl', level: 13 },
                { cryptidId: 'bunnyflame', level: 14 },
                { cryptidId: 'mothling', level: 12 },
            ],
            reward: 750,
        },
        {
            id: 'nurse_hollowell',
            name: 'Nurse Hollowell',
            role: 'healer',
            x: 6, y: 4,
            sprite: '#ee6699',
            dialogue: [
                'The Hollows can be treacherous. Let me heal your team.',
                'All patched up! Be careful in the mist.',
            ],
        },
        {
            id: 'shop_martha',
            name: 'Shopkeeper Martha',
            role: 'shopkeeper',
            x: 10, y: 4,
            sprite: '#88aa44',
            dialogue: [
                'Welcome! I\'ve got everything an explorer needs.',
            ],
            inventory: ['great_trap', 'super_potion', 'antidote', 'burn_heal', 'paralyze_heal'],
        },
        {
            id: 'boss_hollow_keeper',
            name: 'Hollow Keeper',
            role: 'boss',
            x: 26, y: 16,
            sprite: '#442266',
            dialogue: [
                'I am the Hollow Keeper, guardian of these ancient mountains.',
                'Only those who can withstand the darkness may pass.',
                'Prepare yourself!',
            ],
            team: [
                { cryptidId: 'nightowl', level: 16 },
                { cryptidId: 'springheel', level: 15 },
                { cryptidId: 'mothling', level: 17 },
            ],
            reward: 2000,
            badge: 'appalachia_badge',
        },
    ],

    greatplains: [
        {
            id: 'trainer_cowgirl_jessie',
            name: 'Cowgirl Jessie',
            role: 'trainer',
            x: 10, y: 9,
            sprite: '#cc7733',
            dialogue: [
                'Yeehaw! Nothing like a good battle under the open sky!',
            ],
            team: [
                { cryptidId: 'jackalope', level: 14 },
                { cryptidId: 'dustdevil', level: 15 },
            ],
            reward: 700,
        },
        {
            id: 'trainer_storm_chaser_rick',
            name: 'Storm Chaser Rick',
            role: 'trainer',
            x: 20, y: 7,
            sprite: '#5577bb',
            dialogue: [
                'I chase storms for fun. Your Cryptids don\'t scare me!',
            ],
            team: [
                { cryptidId: 'thunderkit', level: 16 },
                { cryptidId: 'gustling', level: 15 },
                { cryptidId: 'sparkpix', level: 16 },
            ],
            reward: 850,
        },
        {
            id: 'trainer_rancher_will',
            name: 'Rancher Will',
            role: 'trainer',
            x: 15, y: 14,
            sprite: '#886644',
            dialogue: [
                'My Cryptids help me work the ranch. They\'re tougher than they look.',
            ],
            team: [
                { cryptidId: 'wolpertinger', level: 17 },
                { cryptidId: 'jackalope', level: 16 },
            ],
            reward: 800,
        },
        {
            id: 'nurse_prairie',
            name: 'Nurse Prairie',
            role: 'healer',
            x: 6, y: 4,
            sprite: '#ee6699',
            dialogue: [
                'The plains are vast. Rest here and heal up!',
                'Your team is good as new!',
            ],
        },
        {
            id: 'shop_dusty',
            name: 'Shopkeeper Dusty',
            role: 'shopkeeper',
            x: 10, y: 4,
            sprite: '#88aa44',
            dialogue: [
                'Dusty\'s General Store! Best prices on the prairie.',
            ],
            inventory: ['great_trap', 'ultra_trap', 'super_potion', 'hyper_potion', 'full_heal'],
        },
        {
            id: 'boss_storm_warden',
            name: 'Storm Warden',
            role: 'boss',
            x: 27, y: 10,
            sprite: '#3355aa',
            dialogue: [
                'I am the Storm Warden. The winds obey my command.',
                'Face the fury of the plains!',
            ],
            team: [
                { cryptidId: 'thunderkit', level: 20 },
                { cryptidId: 'gustling', level: 19 },
                { cryptidId: 'sparkpix', level: 20 },
                { cryptidId: 'wolpertinger', level: 21 },
            ],
            reward: 3500,
            badge: 'greatplains_badge',
        },
    ],

    southwest: [
        {
            id: 'trainer_prospector_sal',
            name: 'Prospector Sal',
            role: 'trainer',
            x: 8, y: 10,
            sprite: '#aa7733',
            dialogue: [
                'I\'ve been digging in these canyons for years. Found something better than gold!',
            ],
            team: [
                { cryptidId: 'sandskitter', level: 20 },
                { cryptidId: 'chupacub', level: 21 },
                { cryptidId: 'scorpius', level: 20 },
            ],
            reward: 1000,
        },
        {
            id: 'trainer_shaman_kai',
            name: 'Shaman Kai',
            role: 'trainer',
            x: 18, y: 8,
            sprite: '#884466',
            dialogue: [
                'The desert spirits guide my Cryptids. Can yours keep up?',
            ],
            team: [
                { cryptidId: 'skinpup', level: 22 },
                { cryptidId: 'ashfiend', level: 23 },
            ],
            reward: 1100,
        },
        {
            id: 'trainer_drifter_maya',
            name: 'Drifter Maya',
            role: 'trainer',
            x: 22, y: 14,
            sprite: '#cc6655',
            dialogue: [
                'I wander the desert alone. My Cryptids are my only companions.',
            ],
            team: [
                { cryptidId: 'chupacub', level: 23 },
                { cryptidId: 'sandskitter', level: 22 },
                { cryptidId: 'ashfiend', level: 24 },
            ],
            reward: 1200,
        },
        {
            id: 'nurse_mesa',
            name: 'Nurse Mesa',
            role: 'healer',
            x: 6, y: 4,
            sprite: '#ee6699',
            dialogue: [
                'The desert sun is brutal. Let me tend to your Cryptids.',
                'All healed! Stay hydrated out there!',
            ],
        },
        {
            id: 'shop_cactus_carl',
            name: 'Cactus Carl',
            role: 'shopkeeper',
            x: 10, y: 4,
            sprite: '#88aa44',
            dialogue: [
                'Welcome to Carl\'s Oasis Shop! Everything you need to survive the desert.',
            ],
            inventory: ['ultra_trap', 'hyper_potion', 'max_potion', 'full_heal', 'revive'],
        },
        {
            id: 'boss_desert_shade',
            name: 'Desert Shade',
            role: 'boss',
            x: 27, y: 16,
            sprite: '#663322',
            dialogue: [
                'I am the Desert Shade. None pass through my domain unchallenged.',
                'The sands will swallow you whole!',
            ],
            team: [
                { cryptidId: 'chupacabra', level: 26 },
                { cryptidId: 'ashfiend', level: 27 },
                { cryptidId: 'scorpius', level: 26 },
                { cryptidId: 'skinpup', level: 28 },
            ],
            reward: 5000,
            badge: 'southwest_badge',
        },
    ],

    mistyloch: [
        {
            id: 'trainer_fisher_angus',
            name: 'Fisher Angus',
            role: 'trainer',
            x: 10, y: 9,
            sprite: '#446688',
            dialogue: [
                'I\'ve fished these waters all me life. My Cryptids are from the deep!',
            ],
            team: [
                { cryptidId: 'tidepup', level: 24 },
                { cryptidId: 'nessling', level: 25 },
                { cryptidId: 'stormeel', level: 24 },
            ],
            reward: 1400,
        },
        {
            id: 'trainer_witch_moira',
            name: 'Hedge Witch Moira',
            role: 'trainer',
            x: 18, y: 7,
            sprite: '#669944',
            dialogue: [
                'The fae folk whisper secrets to me. Shall I share one? You\'re about to lose!',
            ],
            team: [
                { cryptidId: 'bogwitch', level: 26 },
                { cryptidId: 'faerielight', level: 27 },
            ],
            reward: 1500,
        },
        {
            id: 'trainer_diver_finn',
            name: 'Diver Finn',
            role: 'trainer',
            x: 24, y: 12,
            sprite: '#3388aa',
            dialogue: [
                'I\'ve seen things in the deep you wouldn\'t believe. Let\'s battle!',
            ],
            team: [
                { cryptidId: 'stormeel', level: 27 },
                { cryptidId: 'nessling', level: 26 },
                { cryptidId: 'fairyfly', level: 28 },
            ],
            reward: 1600,
        },
        {
            id: 'nurse_lochside',
            name: 'Nurse Lochside',
            role: 'healer',
            x: 6, y: 4,
            sprite: '#ee6699',
            dialogue: [
                'The mist can be disorienting. Rest here a while.',
                'Your Cryptids are refreshed and ready!',
            ],
        },
        {
            id: 'shop_hagrid',
            name: 'Shopkeeper Hagrid',
            role: 'shopkeeper',
            x: 10, y: 4,
            sprite: '#88aa44',
            dialogue: [
                'Welcome to the Lochside Trading Post! Finest goods this side of the mist.',
            ],
            inventory: ['ultra_trap', 'aqua_trap', 'hyper_potion', 'max_potion', 'full_heal', 'revive', 'full_revive'],
        },
        {
            id: 'boss_loch_guardian',
            name: 'Loch Guardian',
            role: 'boss',
            x: 26, y: 16,
            sprite: '#225577',
            dialogue: [
                'I am the Loch Guardian. The waters are my domain.',
                'You have come far, but the depths hold terrors beyond imagination.',
                'Show me the bond you share with your Cryptids!',
            ],
            team: [
                { cryptidId: 'nessie', level: 30 },
                { cryptidId: 'stormeel', level: 29 },
                { cryptidId: 'bogwitch', level: 30 },
                { cryptidId: 'faerielight', level: 31 },
            ],
            reward: 7000,
            badge: 'mistyloch_badge',
        },
    ],

    frozenpeak: [
        {
            id: 'trainer_mountaineer_sven',
            name: 'Mountaineer Sven',
            role: 'trainer',
            x: 10, y: 9,
            sprite: '#5588aa',
            dialogue: [
                'Only the strongest make it this far. Let\'s see what you\'ve got!',
            ],
            team: [
                { cryptidId: 'yetling', level: 30 },
                { cryptidId: 'crystalpup', level: 31 },
                { cryptidId: 'frostfang', level: 30 },
            ],
            reward: 2000,
        },
        {
            id: 'trainer_ice_witch_elsa',
            name: 'Ice Witch Elsa',
            role: 'trainer',
            x: 20, y: 7,
            sprite: '#aaddff',
            dialogue: [
                'The cold doesn\'t bother me. But it will bother you!',
            ],
            team: [
                { cryptidId: 'wendling', level: 32 },
                { cryptidId: 'frostwolf', level: 33 },
            ],
            reward: 2200,
        },
        {
            id: 'trainer_sherpa_tenzing',
            name: 'Sherpa Tenzing',
            role: 'trainer',
            x: 16, y: 14,
            sprite: '#aa8855',
            dialogue: [
                'I have guided many to the summit. Few have defeated me along the way.',
            ],
            team: [
                { cryptidId: 'yetling', level: 33 },
                { cryptidId: 'tidepup', level: 32 },
                { cryptidId: 'crystalpup', level: 34 },
            ],
            reward: 2400,
        },
        {
            id: 'nurse_summit',
            name: 'Nurse Summit',
            role: 'healer',
            x: 6, y: 4,
            sprite: '#ee6699',
            dialogue: [
                'You\'ve made it to the top of the world. Let me heal your team.',
                'All better! The final challenge awaits.',
            ],
        },
        {
            id: 'shop_frostbeard',
            name: 'Shopkeeper Frostbeard',
            role: 'shopkeeper',
            x: 10, y: 4,
            sprite: '#88aa44',
            dialogue: [
                'Frostbeard\'s Peak Provisions! Only the best for those who made it here.',
            ],
            inventory: ['ultra_trap', 'shadow_trap', 'max_potion', 'full_heal', 'full_revive', 'attack_boost', 'defense_boost', 'speed_boost'],
        },
        {
            id: 'boss_frost_sovereign',
            name: 'Frost Sovereign',
            role: 'boss',
            x: 15, y: 2,
            sprite: '#99ccee',
            dialogue: [
                'I am the Frost Sovereign, ruler of the Frozen Peaks.',
                'You have proven yourself across every region of this land.',
                'But this is where your journey meets its ultimate test.',
                'Come! Let us see if you are truly worthy!',
            ],
            team: [
                { cryptidId: 'yeti', level: 38 },
                { cryptidId: 'frostwolf', level: 37 },
                { cryptidId: 'frostfang', level: 38 },
                { cryptidId: 'wendling', level: 40 },
            ],
            reward: 10000,
            badge: 'frozenpeak_badge',
            isFinalBoss: true,
        },
    ],
};

export function getNPCsForRegion(regionId) {
    return NPCs[regionId] || [];
}

export function getNPC(regionId, npcId) {
    const regionNPCs = NPCs[regionId] || [];
    return regionNPCs.find(n => n.id === npcId);
}

export function getTrainersForRegion(regionId) {
    return getNPCsForRegion(regionId).filter(
        n => n.role === 'trainer' || n.role === 'boss'
    );
}
