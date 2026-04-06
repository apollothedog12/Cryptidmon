export const Evolutions = {
    // Line 1: Sasquatch line (Forest Ape)
    sasquatch: { method: 'level', level: 16, into: 'bigfoot' },
    bigfoot: { method: 'level', level: 36, into: 'gigantopith' },

    // Line 2: Mothman line (Winged Humanoid)
    mothling: { method: 'level', level: 18, into: 'mothman' },
    mothman: { method: 'level', level: 34, into: 'mothsovereign' },

    // Line 3: Chupacabra line (Blood Drainer)
    chupacub: { method: 'level', level: 16, into: 'chupacabra' },
    chupacabra: { method: 'level', level: 32, into: 'chupaterror' },

    // Line 4: Nessie line (Lake Monster)
    nessling: { method: 'level', level: 18, into: 'nessie' },
    nessie: { method: 'level', level: 36, into: 'leviathan' },

    // Line 5: Jackalope line (Horned Rabbit)
    jackalkit: { method: 'level', level: 14, into: 'jackalope' },
    jackalope: { method: 'level', level: 30, into: 'wolpertinger' },

    // Line 6: Spring-Heeled Jack line (Leaping Terror)
    springheel: { method: 'level', level: 18, into: 'springjack' },
    springjack: { method: 'level', level: 34, into: 'springterror' },

    // Line 7: Yeti line (Snow Beast)
    yetling: { method: 'level', level: 18, into: 'yeti' },
    yeti: { method: 'level', level: 36, into: 'abominox' },

    // Line 8: Thunderbird line (Storm Raptor)
    thunderkit: { method: 'level', level: 16, into: 'thunderbird' },
    thunderbird: { method: 'level', level: 34, into: 'tempestrix' },

    // Line 9: Wendigo line (Frost Fiend)
    wendling: { method: 'level', level: 20, into: 'wendigo' },
    wendigo: { method: 'level', level: 38, into: 'frostbane' },

    // Line 10: Fairy line (Light Sprite)
    fairyfly: { method: 'level', level: 16, into: 'faerielight' },
    faerielight: { method: 'level', level: 32, into: 'willowisp' },

    // Line 11: Skinwalker line (Shapeshifter)
    skinpup: { method: 'level', level: 20, into: 'skinwalker' },
    skinwalker: { method: 'level', level: 38, into: 'shapelord' },

    // Line 12: Bunny Flame line (Fire Hare)
    bunnyflame: { method: 'level', level: 14, into: 'bunnyburn' },
    bunnyburn: { method: 'level', level: 30, into: 'infernohare' },

    // Line 13: Green Man line (Forest Guardian)
    mossling: { method: 'level', level: 16, into: 'mossback' },
    mossback: { method: 'level', level: 34, into: 'greenman' },

    // Line 14: Selkie line (Sea Shapeshifter)
    tidepup: { method: 'level', level: 18, into: 'tidewalker' },
    tidewalker: { method: 'level', level: 34, into: 'selkielord' },

    // Line 15: Spark Fairy line (Electric Fae)
    sparkpix: { method: 'level', level: 16, into: 'sparkfae' },
    sparkfae: { method: 'level', level: 32, into: 'luminarch' },

    // Line 16: Volcanic Imp line (Magma Fiend)
    ashimp: { method: 'level', level: 18, into: 'ashfiend' },
    ashfiend: { method: 'level', level: 36, into: 'volcanox' },

    // Line 17: Dust Devil line (Wind Trickster)
    gustling: { method: 'level', level: 14, into: 'dustdevil' },
    dustdevil: { method: 'level', level: 30, into: 'tornadox' },

    // Line 18: Crystal Wolf line (Aurora Beast)
    crystalpup: { method: 'level', level: 18, into: 'crystalwolf' },
    crystalwolf: { method: 'level', level: 34, into: 'aurorex' },

    // Line 19: Boggart line (Swamp Witch)
    boggart: { method: 'level', level: 16, into: 'bogwitch' },
    bogwitch: { method: 'level', level: 34, into: 'swamplord' },

    // Line 20: Sand Scorpion line (Desert Predator)
    sandskitter: { method: 'level', level: 16, into: 'sandclaw' },
    sandclaw: { method: 'level', level: 32, into: 'scorpius' },

    // Line 21: Storm Eel line (Tempest Serpent)
    stormeel: { method: 'level', level: 18, into: 'stormserpent' },
    stormserpent: { method: 'level', level: 36, into: 'tempesteel' },

    // Line 22: Night Owl line (Shadow Raptor)
    nightowl: { method: 'level', level: 16, into: 'owlshade' },
    owlshade: { method: 'level', level: 34, into: 'owlterror' },

    // Line 23: Vine Wraith line (Thorn Lord)
    vinecrawl: { method: 'level', level: 18, into: 'vinewraith' },
    vinewraith: { method: 'level', level: 34, into: 'thornlord' },

    // Line 24: Frost Wolf line (Glacial Predator)
    frostfang: { method: 'level', level: 20, into: 'frostwolf' },
    frostwolf: { method: 'level', level: 38, into: 'glacialbane' },
};

export function getEvolution(cryptidId) {
    return Evolutions[cryptidId] || null;
}
