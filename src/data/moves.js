// Move categories
export const Category = {
    PHYSICAL: 'physical',
    SPECIAL: 'special',
    STATUS: 'status',
};

// Status effects that moves can apply
export const StatusEffect = {
    NONE: 'none',
    BURN: 'burn',
    PARALYZE: 'paralyze',
    SLEEP: 'sleep',
    POISON: 'poison',
    FREEZE: 'freeze',
    CONFUSION: 'confusion',
};

// All moves in the game
export const Moves = [
    // Normal moves
    { id: 'tackle', name: 'Tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35, effect: 'none', effectChance: 0, description: 'A basic charging attack.' },
    { id: 'scratch', name: 'Scratch', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35, effect: 'none', effectChance: 0, description: 'Rakes the foe with sharp claws.' },
    { id: 'bite', name: 'Bite', type: 'normal', category: 'physical', power: 60, accuracy: 100, pp: 25, effect: 'none', effectChance: 0, description: 'A vicious biting attack.' },
    { id: 'slam', name: 'Slam', type: 'normal', category: 'physical', power: 80, accuracy: 75, pp: 20, effect: 'none', effectChance: 0, description: 'A powerful body slam.' },
    { id: 'hypercharge', name: 'Hyper Charge', type: 'normal', category: 'special', power: 120, accuracy: 90, pp: 5, effect: 'none', effectChance: 0, description: 'An overwhelming burst of energy. Must recharge next turn.' },
    { id: 'quickstrike', name: 'Quick Strike', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 30, priority: 1, effect: 'none', effectChance: 0, description: 'A blindingly fast attack. Always strikes first.' },
    { id: 'roar', name: 'Roar', type: 'normal', category: 'status', power: 0, accuracy: 100, pp: 20, effect: 'none', effectChance: 0, description: 'A terrifying roar that lowers attack.', statChange: { stat: 'atk', stages: -1, target: 'enemy' } },
    { id: 'growl', name: 'Growl', type: 'normal', category: 'status', power: 0, accuracy: 100, pp: 40, effect: 'none', effectChance: 0, description: 'A low growl that lowers attack.', statChange: { stat: 'atk', stages: -1, target: 'enemy' } },
    { id: 'harden', name: 'Harden', type: 'normal', category: 'status', power: 0, accuracy: 100, pp: 30, effect: 'none', effectChance: 0, description: 'Toughens the body to raise defense.', statChange: { stat: 'def', stages: 1, target: 'self' } },
    { id: 'rest', name: 'Rest', type: 'normal', category: 'status', power: 0, accuracy: 100, pp: 10, effect: 'sleep', effectChance: 100, description: 'Falls asleep to fully restore HP.', heal: 'full', selfSleep: true },

    // Shadow moves
    { id: 'shadowswipe', name: 'Shadow Swipe', type: 'shadow', category: 'physical', power: 40, accuracy: 100, pp: 30, effect: 'none', effectChance: 0, description: 'Strikes from the shadows.' },
    { id: 'nightpulse', name: 'Night Pulse', type: 'shadow', category: 'special', power: 65, accuracy: 100, pp: 20, effect: 'none', effectChance: 0, description: 'A wave of dark energy.' },
    { id: 'darkterror', name: 'Dark Terror', type: 'shadow', category: 'special', power: 80, accuracy: 100, pp: 15, effect: 'confusion', effectChance: 20, description: 'Unleashes terrifying dark energy.' },
    { id: 'voidblast', name: 'Void Blast', type: 'shadow', category: 'special', power: 110, accuracy: 85, pp: 5, effect: 'none', effectChance: 0, description: 'A devastating blast of void energy.' },
    { id: 'nightmare', name: 'Nightmare', type: 'shadow', category: 'status', power: 0, accuracy: 100, pp: 15, effect: 'sleep', effectChance: 75, description: 'Induces terrible nightmares.' },
    { id: 'shadowcloak', name: 'Shadow Cloak', type: 'shadow', category: 'status', power: 0, accuracy: 100, pp: 20, effect: 'none', effectChance: 0, description: 'Wraps in shadows to raise evasion.', statChange: { stat: 'spDef', stages: 1, target: 'self' } },

    // Light moves
    { id: 'sparkbeam', name: 'Spark Beam', type: 'light', category: 'special', power: 40, accuracy: 100, pp: 30, effect: 'none', effectChance: 0, description: 'A small beam of light.' },
    { id: 'radiance', name: 'Radiance', type: 'light', category: 'special', power: 70, accuracy: 100, pp: 20, effect: 'none', effectChance: 0, description: 'Bathes the foe in blinding light.' },
    { id: 'holyflare', name: 'Holy Flare', type: 'light', category: 'special', power: 95, accuracy: 90, pp: 10, effect: 'burn', effectChance: 20, description: 'A searing blast of holy light.' },
    { id: 'purify', name: 'Purify', type: 'light', category: 'status', power: 0, accuracy: 100, pp: 20, effect: 'none', effectChance: 0, description: 'Purifies all status conditions.', cureStatus: true },
    { id: 'aurora', name: 'Aurora', type: 'light', category: 'special', power: 120, accuracy: 85, pp: 5, effect: 'none', effectChance: 0, description: 'Channels the northern lights into a devastating attack.' },

    // Spirit moves
    { id: 'haunt', name: 'Haunt', type: 'spirit', category: 'special', power: 40, accuracy: 100, pp: 30, effect: 'none', effectChance: 0, description: 'A ghostly presence attacks.' },
    { id: 'phantomwave', name: 'Phantom Wave', type: 'spirit', category: 'special', power: 65, accuracy: 100, pp: 20, effect: 'none', effectChance: 0, description: 'A wave of spectral energy.' },
    { id: 'soulrend', name: 'Soul Rend', type: 'spirit', category: 'special', power: 90, accuracy: 90, pp: 10, effect: 'none', effectChance: 0, description: 'Tears at the foe\'s spirit.' },
    { id: 'possess', name: 'Possess', type: 'spirit', category: 'status', power: 0, accuracy: 80, pp: 15, effect: 'confusion', effectChance: 100, description: 'Attempts to possess the foe.' },
    { id: 'spiritshield', name: 'Spirit Shield', type: 'spirit', category: 'status', power: 0, accuracy: 100, pp: 20, effect: 'none', effectChance: 0, description: 'Creates a spectral barrier.', statChange: { stat: 'def', stages: 2, target: 'self' } },

    // Aquatic moves
    { id: 'splash', name: 'Water Splash', type: 'aquatic', category: 'special', power: 40, accuracy: 100, pp: 30, effect: 'none', effectChance: 0, description: 'Splashes water at the foe.' },
    { id: 'tidalwave', name: 'Tidal Wave', type: 'aquatic', category: 'special', power: 75, accuracy: 100, pp: 15, effect: 'none', effectChance: 0, description: 'A massive wave crashes down.' },
    { id: 'deepcrush', name: 'Deep Crush', type: 'aquatic', category: 'physical', power: 85, accuracy: 90, pp: 10, effect: 'none', effectChance: 0, description: 'Crushing pressure from the deep.' },
    { id: 'whirlpool', name: 'Whirlpool', type: 'aquatic', category: 'special', power: 50, accuracy: 85, pp: 15, effect: 'none', effectChance: 0, description: 'Traps foe in a raging whirlpool.', trap: true },
    { id: 'tsunami', name: 'Tsunami', type: 'aquatic', category: 'special', power: 110, accuracy: 80, pp: 5, effect: 'none', effectChance: 0, description: 'A colossal wave that devastates everything.' },

    // Fire moves
    { id: 'ember', name: 'Ember', type: 'fire', category: 'special', power: 40, accuracy: 100, pp: 25, effect: 'burn', effectChance: 10, description: 'A small flame attack.' },
    { id: 'flameburst', name: 'Flame Burst', type: 'fire', category: 'special', power: 70, accuracy: 100, pp: 15, effect: 'burn', effectChance: 15, description: 'An explosive burst of flame.' },
    { id: 'inferno', name: 'Inferno', type: 'fire', category: 'special', power: 100, accuracy: 85, pp: 5, effect: 'burn', effectChance: 30, description: 'A raging inferno engulfs the foe.' },
    { id: 'fireclaw', name: 'Fire Claw', type: 'fire', category: 'physical', power: 75, accuracy: 100, pp: 15, effect: 'burn', effectChance: 10, description: 'Slashes with flame-wreathed claws.' },
    { id: 'heatwave', name: 'Heat Wave', type: 'fire', category: 'special', power: 95, accuracy: 90, pp: 10, effect: 'burn', effectChance: 10, description: 'A scorching wave of heat.' },

    // Earth moves
    { id: 'rockthrow', name: 'Rock Throw', type: 'earth', category: 'physical', power: 50, accuracy: 90, pp: 25, effect: 'none', effectChance: 0, description: 'Hurls a rock at the foe.' },
    { id: 'earthquake', name: 'Earthquake', type: 'earth', category: 'physical', power: 100, accuracy: 100, pp: 10, effect: 'none', effectChance: 0, description: 'A devastating seismic attack.' },
    { id: 'mudslide', name: 'Mudslide', type: 'earth', category: 'physical', power: 65, accuracy: 95, pp: 20, effect: 'none', effectChance: 0, description: 'A torrent of mud buries the foe.', statChange: { stat: 'spd', stages: -1, target: 'enemy' } },
    { id: 'stoneedge', name: 'Stone Edge', type: 'earth', category: 'physical', power: 100, accuracy: 80, pp: 5, effect: 'none', effectChance: 0, description: 'Razor-sharp stones strike the foe. High crit rate.', critBoost: true },
    { id: 'sandstorm', name: 'Sandstorm', type: 'earth', category: 'status', power: 0, accuracy: 100, pp: 10, effect: 'none', effectChance: 0, description: 'Whips up a sandstorm.', weather: 'sandstorm' },

    // Electric moves
    { id: 'zap', name: 'Zap', type: 'electric', category: 'special', power: 40, accuracy: 100, pp: 30, effect: 'paralyze', effectChance: 10, description: 'A small electric shock.' },
    { id: 'thunderbolt', name: 'Thunderbolt', type: 'electric', category: 'special', power: 90, accuracy: 100, pp: 15, effect: 'paralyze', effectChance: 10, description: 'A powerful bolt of lightning.' },
    { id: 'lightningfang', name: 'Lightning Fang', type: 'electric', category: 'physical', power: 65, accuracy: 95, pp: 15, effect: 'paralyze', effectChance: 15, description: 'Bites with electrified fangs.' },
    { id: 'staticfield', name: 'Static Field', type: 'electric', category: 'status', power: 0, accuracy: 100, pp: 20, effect: 'paralyze', effectChance: 100, description: 'Fills the air with static.' },
    { id: 'stormcall', name: 'Storm Call', type: 'electric', category: 'special', power: 120, accuracy: 70, pp: 5, effect: 'paralyze', effectChance: 30, description: 'Calls down a devastating lightning storm.' },

    // Flora moves
    { id: 'vinewhip', name: 'Vine Whip', type: 'flora', category: 'physical', power: 45, accuracy: 100, pp: 25, effect: 'none', effectChance: 0, description: 'Strikes with springy vines.' },
    { id: 'razorleaf', name: 'Razor Leaf', type: 'flora', category: 'physical', power: 55, accuracy: 95, pp: 25, effect: 'none', effectChance: 0, description: 'Launches sharp leaves. High crit rate.', critBoost: true },
    { id: 'naturefury', name: 'Nature\'s Fury', type: 'flora', category: 'special', power: 90, accuracy: 100, pp: 10, effect: 'none', effectChance: 0, description: 'Channels the wrath of nature.' },
    { id: 'sporecloud', name: 'Spore Cloud', type: 'flora', category: 'status', power: 0, accuracy: 90, pp: 15, effect: 'sleep', effectChance: 100, description: 'Releases sleep-inducing spores.' },
    { id: 'leechseed', name: 'Leech Seed', type: 'flora', category: 'status', power: 0, accuracy: 90, pp: 10, effect: 'none', effectChance: 0, description: 'Plants a seed that drains HP each turn.', leechSeed: true },
    { id: 'solarbeam', name: 'Solar Beam', type: 'flora', category: 'special', power: 120, accuracy: 100, pp: 5, effect: 'none', effectChance: 0, description: 'A powerful beam of solar energy.' },

    // Wind moves
    { id: 'gust', name: 'Gust', type: 'wind', category: 'special', power: 40, accuracy: 100, pp: 35, effect: 'none', effectChance: 0, description: 'A strong gust of wind.' },
    { id: 'aeroblast', name: 'Aero Blast', type: 'wind', category: 'special', power: 75, accuracy: 95, pp: 15, effect: 'none', effectChance: 0, description: 'A powerful blast of air.' },
    { id: 'hurricane', name: 'Hurricane', type: 'wind', category: 'special', power: 110, accuracy: 70, pp: 5, effect: 'confusion', effectChance: 30, description: 'A ferocious hurricane.' },
    { id: 'tailwind', name: 'Tailwind', type: 'wind', category: 'status', power: 0, accuracy: 100, pp: 15, effect: 'none', effectChance: 0, description: 'Creates a tailwind to boost speed.', statChange: { stat: 'spd', stages: 2, target: 'self' } },
    { id: 'wingslash', name: 'Wing Slash', type: 'wind', category: 'physical', power: 60, accuracy: 100, pp: 20, effect: 'none', effectChance: 0, description: 'Slashes with razor-sharp wings.' },

    // Ice moves
    { id: 'frostbite', name: 'Frost Bite', type: 'ice', category: 'special', power: 45, accuracy: 100, pp: 25, effect: 'freeze', effectChance: 10, description: 'A chilling bite of frost.' },
    { id: 'icebeam', name: 'Ice Beam', type: 'ice', category: 'special', power: 90, accuracy: 100, pp: 10, effect: 'freeze', effectChance: 10, description: 'A freezing beam of ice.' },
    { id: 'blizzard', name: 'Blizzard', type: 'ice', category: 'special', power: 110, accuracy: 70, pp: 5, effect: 'freeze', effectChance: 15, description: 'A howling blizzard.' },
    { id: 'icefang', name: 'Ice Fang', type: 'ice', category: 'physical', power: 65, accuracy: 95, pp: 15, effect: 'freeze', effectChance: 10, description: 'Bites with ice-cold fangs.' },
    { id: 'hail', name: 'Hail', type: 'ice', category: 'status', power: 0, accuracy: 100, pp: 10, effect: 'none', effectChance: 0, description: 'Summons a hailstorm.', weather: 'hail' },

    // Psychic moves
    { id: 'mindpulse', name: 'Mind Pulse', type: 'psychic', category: 'special', power: 50, accuracy: 100, pp: 25, effect: 'none', effectChance: 0, description: 'A pulse of psychic energy.' },
    { id: 'psychicblast', name: 'Psychic Blast', type: 'psychic', category: 'special', power: 90, accuracy: 100, pp: 10, effect: 'none', effectChance: 0, description: 'A massive psychic attack.', statChange: { stat: 'spDef', stages: -1, target: 'enemy' } },
    { id: 'telekinesis', name: 'Telekinesis', type: 'psychic', category: 'special', power: 70, accuracy: 100, pp: 15, effect: 'confusion', effectChance: 20, description: 'Attacks with telekinetic force.' },
    { id: 'hypnosis', name: 'Hypnosis', type: 'psychic', category: 'status', power: 0, accuracy: 70, pp: 20, effect: 'sleep', effectChance: 100, description: 'Hypnotizes the foe into sleep.' },
    { id: 'barrier', name: 'Barrier', type: 'psychic', category: 'status', power: 0, accuracy: 100, pp: 20, effect: 'none', effectChance: 0, description: 'Creates a psychic barrier.', statChange: { stat: 'def', stages: 2, target: 'self' } },
];

export function getMove(id) {
    return Moves.find(m => m.id === id);
}
