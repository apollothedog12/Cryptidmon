export const Types = {
    NORMAL: 'normal',
    SHADOW: 'shadow',
    LIGHT: 'light',
    SPIRIT: 'spirit',
    AQUATIC: 'aquatic',
    FIRE: 'fire',
    EARTH: 'earth',
    ELECTRIC: 'electric',
    FLORA: 'flora',
    WIND: 'wind',
    ICE: 'ice',
    PSYCHIC: 'psychic',
};

// Effectiveness matrix: attacker type -> defender type -> multiplier
// 2.0 = super effective, 1.0 = normal, 0.5 = not very effective, 0 = no effect
const chart = {
    normal:   { normal: 1, shadow: 1, light: 1, spirit: 0, aquatic: 1, fire: 1, earth: 1, electric: 1, flora: 1, wind: 1, ice: 1, psychic: 1 },
    shadow:   { normal: 1, shadow: 0.5, light: 0.5, spirit: 2, aquatic: 1, fire: 0.5, earth: 1, electric: 1, flora: 1, wind: 1, ice: 1, psychic: 2 },
    light:    { normal: 1, shadow: 2, light: 0.5, spirit: 2, aquatic: 1, fire: 1, earth: 0.5, electric: 1, flora: 1, wind: 1, ice: 1, psychic: 0.5 },
    spirit:   { normal: 2, shadow: 0.5, light: 0.5, spirit: 1, aquatic: 1, fire: 1, earth: 2, electric: 1, flora: 1, wind: 1, ice: 1, psychic: 1 },
    aquatic:  { normal: 1, shadow: 1, light: 1, spirit: 1, aquatic: 0.5, fire: 2, earth: 2, electric: 0.5, flora: 0.5, wind: 1, ice: 0.5, psychic: 1 },
    fire:     { normal: 1, shadow: 1, light: 1, spirit: 1, aquatic: 0.5, fire: 0.5, earth: 0.5, electric: 1, flora: 2, wind: 1, ice: 2, psychic: 1 },
    earth:    { normal: 1, shadow: 1, light: 1, spirit: 1, aquatic: 0.5, fire: 2, earth: 1, electric: 2, flora: 0.5, wind: 1, ice: 1, psychic: 1 },
    electric: { normal: 1, shadow: 1, light: 1, spirit: 1, aquatic: 2, fire: 1, earth: 0, electric: 0.5, flora: 0.5, wind: 2, ice: 1, psychic: 1 },
    flora:    { normal: 1, shadow: 1, light: 1, spirit: 1, aquatic: 2, fire: 0.5, earth: 2, electric: 1, flora: 0.5, wind: 0.5, ice: 0.5, psychic: 1 },
    wind:     { normal: 1, shadow: 1, light: 1, spirit: 1, aquatic: 1, fire: 1, earth: 1, electric: 0.5, flora: 2, wind: 0.5, ice: 1, psychic: 1 },
    ice:      { normal: 1, shadow: 1, light: 1, spirit: 1, aquatic: 1, fire: 0.5, earth: 1, electric: 1, flora: 2, wind: 2, ice: 0.5, psychic: 1 },
    psychic:  { normal: 1, shadow: 0.5, light: 1, spirit: 1, aquatic: 1, fire: 1, earth: 1, electric: 1, flora: 1, wind: 1, ice: 1, psychic: 0.5 },
};

export function getEffectiveness(attackType, defenderTypes) {
    let multiplier = 1;
    for (const defType of defenderTypes) {
        multiplier *= (chart[attackType]?.[defType] ?? 1);
    }
    return multiplier;
}

export function getEffectivenessText(multiplier) {
    if (multiplier >= 2) return "It's super effective!";
    if (multiplier > 0 && multiplier < 1) return "It's not very effective...";
    if (multiplier === 0) return "It has no effect...";
    return null;
}
