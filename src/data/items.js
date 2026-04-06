export const ItemType = {
    TRAP: 'trap',
    POTION: 'potion',
    STATUS_HEAL: 'status_heal',
    EVOLUTION: 'evolution',
    KEY: 'key',
    BATTLE: 'battle',
};

export const Items = [
    // Trap devices (for catching cryptids)
    { id: 'basic_trap', name: 'Basic Trap', type: 'trap', catchModifier: 1.0, price: 200, description: 'A standard cryptid trap. Moderate catch rate.' },
    { id: 'great_trap', name: 'Great Trap', type: 'trap', catchModifier: 1.5, price: 600, description: 'An improved trap with better catch rate.' },
    { id: 'ultra_trap', name: 'Ultra Trap', type: 'trap', catchModifier: 2.0, price: 1200, description: 'A high-tech trap. Excellent catch rate.' },
    { id: 'master_trap', name: 'Master Trap', type: 'trap', catchModifier: 255, price: 0, description: 'The ultimate trap. Never fails.' },
    { id: 'shadow_trap', name: 'Shadow Trap', type: 'trap', catchModifier: 3.0, price: 1000, description: 'Works best on Shadow and Spirit types.', bonusTypes: ['shadow', 'spirit'] },
    { id: 'aqua_trap', name: 'Aqua Trap', type: 'trap', catchModifier: 3.0, price: 1000, description: 'Works best on Aquatic types.', bonusTypes: ['aquatic'] },

    // Healing items
    { id: 'potion', name: 'Potion', type: 'potion', healAmount: 20, price: 300, description: 'Restores 20 HP.' },
    { id: 'super_potion', name: 'Super Potion', type: 'potion', healAmount: 50, price: 700, description: 'Restores 50 HP.' },
    { id: 'hyper_potion', name: 'Hyper Potion', type: 'potion', healAmount: 120, price: 1500, description: 'Restores 120 HP.' },
    { id: 'max_potion', name: 'Max Potion', type: 'potion', healAmount: 9999, price: 2500, description: 'Fully restores HP.' },
    { id: 'revive', name: 'Revive', type: 'potion', healAmount: 0.5, revive: true, price: 1500, description: 'Revives a fainted cryptid to half HP.' },
    { id: 'full_revive', name: 'Full Revive', type: 'potion', healAmount: 9999, revive: true, price: 4000, description: 'Fully revives a fainted cryptid.' },

    // Status heals
    { id: 'antidote', name: 'Antidote', type: 'status_heal', cures: ['poison'], price: 100, description: 'Cures poison.' },
    { id: 'burn_heal', name: 'Burn Heal', type: 'status_heal', cures: ['burn'], price: 250, description: 'Cures burns.' },
    { id: 'paralyze_heal', name: 'Paralyze Heal', type: 'status_heal', cures: ['paralyze'], price: 200, description: 'Cures paralysis.' },
    { id: 'awakening', name: 'Awakening', type: 'status_heal', cures: ['sleep'], price: 250, description: 'Wakes a sleeping cryptid.' },
    { id: 'full_heal', name: 'Full Heal', type: 'status_heal', cures: ['all'], price: 600, description: 'Cures all status conditions.' },

    // Evolution items
    { id: 'moonstone', name: 'Moon Stone', type: 'evolution', price: 0, description: 'A mysterious stone that glows in moonlight. Causes certain cryptids to evolve.' },
    { id: 'shadowgem', name: 'Shadow Gem', type: 'evolution', price: 0, description: 'A gem that pulses with dark energy. Causes certain cryptids to evolve.' },
    { id: 'lightcrystal', name: 'Light Crystal', type: 'evolution', price: 0, description: 'A crystal of pure radiance. Causes certain cryptids to evolve.' },

    // Battle items
    { id: 'attack_boost', name: 'Power Fang', type: 'battle', price: 500, description: 'Sharply raises Attack in battle.', statChange: { stat: 'atk', stages: 2 } },
    { id: 'defense_boost', name: 'Iron Shell', type: 'battle', price: 500, description: 'Sharply raises Defense in battle.', statChange: { stat: 'def', stages: 2 } },
    { id: 'speed_boost', name: 'Swift Feather', type: 'battle', price: 500, description: 'Sharply raises Speed in battle.', statChange: { stat: 'spd', stages: 2 } },

    // Key items
    { id: 'old_map', name: 'Old Map', type: 'key', price: 0, description: 'A weathered map showing strange locations. Given by Professor Elm.' },
    { id: 'cryptidex', name: 'Cryptidex', type: 'key', price: 0, description: 'A digital encyclopedia that records data on cryptids you encounter.' },
    { id: 'bike', name: 'Mountain Bike', type: 'key', price: 0, description: 'A sturdy bike for faster travel.' },
];

export function getItem(id) {
    return Items.find(i => i.id === id);
}
