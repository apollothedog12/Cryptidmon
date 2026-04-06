// ============================================================================
// Cryptidmon — Main Entry Point
// Wires together the engine, scenes, systems, data, and game flow.
// ============================================================================

import { Game } from './engine/Game.js';
import { TitleScene } from './scenes/TitleScene.js';
import { OverworldScene } from './scenes/OverworldScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { CryptidexScene } from './scenes/CryptidexScene.js';
import { EvolutionScene } from './scenes/EvolutionScene.js';
import { StarterSelectScene } from './scenes/StarterSelectScene.js';
import { ShopScene } from './scenes/ShopScene.js';
import { BattleSystem } from './systems/BattleSystem.js';
import { CatchSystem } from './systems/CatchSystem.js';
import { EvolutionSystem } from './systems/EvolutionSystem.js';
import { EncounterSystem } from './systems/EncounterSystem.js';
import { QuestSystem } from './systems/QuestSystem.js';
import { Player } from './entities/Player.js';
import { Cryptid } from './entities/Cryptid.js';
import { TouchControls } from './ui/TouchControls.js';
import { Cryptids, getCryptid } from './data/cryptids.js';
import { Moves } from './data/moves.js';
import { Evolutions } from './data/evolutions.js';
import { Regions } from './data/regions.js';
import { Maps, MapMeta } from './data/maps.js';
import { NPCs, getNPCsForRegion } from './data/npcs.js';
import { Quests } from './data/quests.js';
import { Items, getItem } from './data/items.js';

// ---------------------------------------------------------------------------
// Expose Moves globally so Cryptid.learnMove can look them up without
// circular-dependency issues (see entities/Cryptid.js require_moves()).
// ---------------------------------------------------------------------------
window.__cryptidmon_moves = Moves;

// ---------------------------------------------------------------------------
// Core singletons
// ---------------------------------------------------------------------------
const game = new Game();
const battleSystem = new BattleSystem();
const catchSystem = new CatchSystem();
const evolutionSystem = new EvolutionSystem(Evolutions, Cryptids);
const encounterSystem = new EncounterSystem(Regions, Cryptids);

let questSystem = null;   // created once a game is started / loaded
let player = null;
let currentRegion = 'pinewatch';

const touchControls = new TouchControls(game.input);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build an OverworldScene for the given region and swap to it.
 */
function createOverworld(regionId) {
    currentRegion = regionId;
    const mapData = Maps[regionId];
    const meta = MapMeta[regionId];
    const npcs = getNPCsForRegion(regionId);
    game.globalState.currentRegion = regionId;
    return new OverworldScene(mapData, meta, npcs, regionId, encounterSystem, questSystem, player);
}

/**
 * Walk through every party member and trigger an evolution scene when
 * eligible.  Scenes are chained so they play one after another.
 */
function checkPartyEvolutions(callback) {
    const eligible = [];
    for (const cryptid of player.party) {
        const evo = evolutionSystem.checkEvolution(cryptid);
        if (evo) {
            eligible.push({ cryptid, evo });
        }
    }

    if (eligible.length === 0) {
        if (callback) callback();
        return;
    }

    // Chain evolution scenes sequentially
    let idx = 0;
    function nextEvolution() {
        if (idx >= eligible.length) {
            if (callback) callback();
            return;
        }
        const { cryptid, evo } = eligible[idx];
        idx++;
        const oldName = cryptid.name;
        const result = evolutionSystem.evolve(cryptid, evo);
        if (result) {
            game.globalState.cryptidexSeen.add(cryptid.templateId);
            game.globalState.cryptidexCaught.add(cryptid.templateId);
            game.pushScene(new EvolutionScene(oldName, result.newName, cryptid, () => {
                game.popScene();
                nextEvolution();
            }));
        } else {
            nextEvolution();
        }
    }
    nextEvolution();
}

/**
 * Build a save-state object that SaveManager expects.
 */
function buildSaveState() {
    return {
        playerName: game.globalState.playerName,
        playTime: game.globalState.playTime,
        gold: game.globalState.gold,
        badges: game.globalState.badges,
        currentRegion,
        playerX: player.tileX,
        playerY: player.tileY,
        party: player.party,
        pcBox: player.pcBox,
        inventory: player.inventory,
        questStates: game.globalState.questStates,
        cryptidexSeen: game.globalState.cryptidexSeen,
        cryptidexCaught: game.globalState.cryptidexCaught,
        flags: game.globalState.flags,
    };
}

/**
 * Determine which direction the player exited and find the connected region.
 * Zone-exit tiles (8) sit along map edges; we figure out which edge.
 */
function findConnectedRegion(regionId) {
    const meta = MapMeta[regionId];
    if (!meta || !meta.connections) return null;

    const mapData = Maps[regionId];
    const rows = mapData.length;
    const cols = mapData[0].length;
    const px = player.tileX;
    const py = player.tileY;

    // Check which edge the player is on
    if (py <= 0 && meta.connections.north) return meta.connections.north;
    if (py >= rows - 1 && meta.connections.south) return meta.connections.south;
    if (px >= cols - 1 && meta.connections.east) return meta.connections.east;
    if (px <= 0 && meta.connections.west) return meta.connections.west;

    // Fallback: try any connected region that exists
    for (const dir of ['north', 'south', 'east', 'west']) {
        if (meta.connections[dir]) return meta.connections[dir];
    }
    return null;
}

// ---------------------------------------------------------------------------
// Game callbacks
// ---------------------------------------------------------------------------

/**
 * NEW GAME — creates player, offers starter selection, then enters the world.
 */
game.onNewGame = () => {
    const start = MapMeta.pinewatch.playerStart || { x: 5, y: 10 };
    player = new Player(start.x, start.y);

    // Starter supplies
    player.addItem('basic_trap', 5);
    player.addItem('potion', 3);

    // Reset global state for a fresh run
    game.globalState.gold = 1000;
    game.globalState.badges = [];
    game.globalState.playTime = 0;
    game.globalState.questStates = {};
    game.globalState.cryptidexSeen = new Set();
    game.globalState.cryptidexCaught = new Set();
    game.globalState.flags = {};

    // Initialise quest system
    questSystem = new QuestSystem(Quests, game.globalState);
    questSystem.startQuest('main_1');

    // Build the three starters from their templates
    const sasquatchTemplate = getCryptid('sasquatch');
    const mothlingTemplate = getCryptid('mothling');
    const nesslingTemplate = getCryptid('nessling');

    const starters = [
        new Cryptid(sasquatchTemplate, 5),
        new Cryptid(mothlingTemplate, 5),
        new Cryptid(nesslingTemplate, 5),
    ];

    // Show the starter-select screen
    const starterScene = new StarterSelectScene(starters, (chosen) => {
        // Add the chosen cryptid to the player's party
        player.addToParty(chosen);

        // Record in cryptidex
        game.globalState.cryptidexSeen.add(chosen.templateId);
        game.globalState.cryptidexCaught.add(chosen.templateId);

        // Mark that we have a starter
        game.globalState.flags.got_starter = true;

        // Give the cryptidex key item
        player.addItem('cryptidex', 1);
        questSystem.updateObjective('collect_item', 'cryptidex');

        // Transition into the starting overworld
        game.popScene(); // remove StarterSelectScene
        const overworld = createOverworld('pinewatch');
        game.transitionTo(overworld);
    });

    // Swap from TitleScene to StarterSelectScene
    game.swapScene(starterScene);
};

/**
 * CONTINUE — load a save slot and jump back to the overworld.
 */
game.onContinue = (slot) => {
    const data = game.save.load(slot);
    if (!data) return;

    // Restore global state
    game.globalState.playerName = data.playerName || 'Scout';
    game.globalState.playTime = data.playTime || 0;
    game.globalState.gold = data.gold ?? 1000;
    game.globalState.badges = data.badges || [];
    game.globalState.questStates = data.questStates || {};
    game.globalState.cryptidexSeen = data.cryptidexSeen instanceof Set
        ? data.cryptidexSeen : new Set(data.cryptidexSeen || []);
    game.globalState.cryptidexCaught = data.cryptidexCaught instanceof Set
        ? data.cryptidexCaught : new Set(data.cryptidexCaught || []);
    game.globalState.flags = data.flags || {};

    // Reconstruct player
    const px = data.playerX ?? 5;
    const py = data.playerY ?? 10;
    player = new Player(px, py);
    player.inventory = data.inventory || {};

    // Rebuild party from serialised data
    if (data.party) {
        for (const cd of data.party) {
            if (!cd) continue;
            const template = getCryptid(cd.templateId);
            if (!template) continue;
            const cryptid = Cryptid.deserialize(cd, template);
            player.party.push(cryptid);
        }
    }

    // Rebuild PC box
    if (data.pcBox) {
        for (const cd of data.pcBox) {
            if (!cd) continue;
            const template = getCryptid(cd.templateId);
            if (!template) continue;
            const cryptid = Cryptid.deserialize(cd, template);
            player.pcBox.push(cryptid);
        }
    }

    // Initialise quest system
    questSystem = new QuestSystem(Quests, game.globalState);

    // Enter saved region
    currentRegion = data.currentRegion || 'pinewatch';
    const overworld = createOverworld(currentRegion);
    game.transitionTo(overworld);
};

/**
 * WILD ENCOUNTER — push a BattleScene for a wild cryptid.
 */
game.onWildEncounter = (wildCryptid) => {
    const battleScene = new BattleScene(
        player.party,
        wildCryptid,
        false,   // isTrainer
        null,    // trainerData
        battleSystem,
        catchSystem,
        (result) => game.onBattleEnd(result),
    );
    game.transitionTo(battleScene);
};

/**
 * TRAINER BATTLE — build the trainer's party and fight.
 */
game.onTrainerBattle = (npc) => {
    const enemyParty = [];
    if (npc.team) {
        for (const member of npc.team) {
            const template = getCryptid(member.cryptidId);
            if (template) {
                enemyParty.push(new Cryptid(template, member.level));
            }
        }
    }

    const trainerData = {
        name: npc.name,
        party: enemyParty,
    };

    const battleScene = new BattleScene(
        player.party,
        enemyParty[0],         // lead cryptid
        true,                   // isTrainer
        trainerData,
        battleSystem,
        catchSystem,
        (result) => {
            if (result.outcome === 'win') {
                // Mark trainer as defeated
                game.globalState.flags[`defeated_${npc.id}`] = true;

                // Gold reward
                const reward = npc.reward || 0;
                game.globalState.gold += reward;

                // Badge (if boss)
                if (npc.badge) {
                    if (!game.globalState.badges.includes(npc.badge)) {
                        game.globalState.badges.push(npc.badge);
                    }
                    questSystem.updateObjective('collect_item', npc.badge);
                }

                // Update quest objectives for defeating this trainer / boss
                questSystem.updateObjective('defeat_trainer', npc.id);
                questSystem.updateObjective('defeat_boss', npc.id);
            }

            game.onBattleEnd(result);
        },
    );
    game.transitionTo(battleScene);
};

/**
 * BATTLE END — process results and return to the overworld.
 */
game.onBattleEnd = (result) => {
    const outcome = result.outcome || result;

    switch (outcome) {
        case 'caught': {
            const caught = result.cryptid;
            if (caught) {
                // Add to party or PC
                const inParty = player.addToParty(caught);
                // Mark in cryptidex
                game.globalState.cryptidexSeen.add(caught.templateId);
                game.globalState.cryptidexCaught.add(caught.templateId);
                // Quest objective
                questSystem.updateObjective('catch', caught.templateId);
                if (caught.types) {
                    for (const t of caught.types) {
                        questSystem.updateObjective('catch_type', t);
                    }
                }
            }
            // Pop battle scene and check evolutions
            game.popScene();
            checkPartyEvolutions(() => {
                // Auto-save after catch
                game.save.save(0, buildSaveState());
            });
            break;
        }

        case 'win': {
            // Award XP to participating party members
            if (result.xpGains) {
                for (const gain of result.xpGains) {
                    const cryptid = player.party.find(c => c === gain.cryptid);
                    if (cryptid) {
                        cryptid.gainXp(gain.amount);
                    }
                }
            }
            game.popScene();
            // Check evolutions for the whole party after XP gains
            checkPartyEvolutions(() => {
                // Auto-save after win
                game.save.save(0, buildSaveState());
            });
            break;
        }

        case 'lose': {
            // Heal all party members so the player can keep going
            player.healAll();
            game.popScene();

            // Return the player to the current region's start position
            const meta = MapMeta[currentRegion];
            if (meta && meta.playerStart) {
                player.tileX = meta.playerStart.x;
                player.tileY = meta.playerStart.y;
                player.x = player.tileX * 32;  // TILE_SIZE
                player.y = player.tileY * 32;
                player.targetX = player.x;
                player.targetY = player.y;
                player.moving = false;
            }

            // Rebuild the overworld so the camera resets
            const overworld = createOverworld(currentRegion);
            game.swapScene(overworld);
            break;
        }

        case 'flee':
        default: {
            // Simply return to the overworld
            game.popScene();
            break;
        }
    }
};

/**
 * OPEN MENU — push the in-game menu overlay.
 */
game.onOpenMenu = () => {
    const menuScene = new MenuScene(player, questSystem, {
        onSave: () => {
            game.save.save(0, buildSaveState());
        },
        onCryptidex: () => {
            game.onOpenCryptidex();
        },
        globalState: game.globalState,
    });
    game.pushScene(menuScene);
};

/**
 * OPEN SHOP — push a ShopScene for the given shopkeeper NPC.
 */
game.onOpenShop = (npc) => {
    // Determine shop inventory from the NPC's inventory list
    const shopItems = [];
    const inventoryList = npc.inventory || [];
    for (const itemId of inventoryList) {
        const item = getItem(itemId);
        if (item && item.price > 0) {
            shopItems.push(item);
        }
    }

    // Fallback: if no items listed, show basic consumables
    if (shopItems.length === 0) {
        for (const item of Items) {
            if (item.price > 0 && item.price <= 2500 && item.type !== 'key' && item.type !== 'evolution') {
                shopItems.push(item);
            }
        }
    }

    const shopScene = new ShopScene(shopItems, player, game.globalState, () => {
        game.popScene();
    });
    game.pushScene(shopScene);
};

/**
 * STARTER SELECT — handled within onNewGame; this callback is for NPC
 * interaction (professor) but starter flow already runs from onNewGame.
 */
game.onStarterSelect = () => {
    // Starter selection is driven from onNewGame. If the professor is
    // interacted with after the starter is chosen the overworld scene
    // will show alternate dialogue, so nothing needs to happen here.
};

/**
 * ZONE EXIT — transition to the connected region.
 */
game.onZoneExit = (exitRegion) => {
    const nextRegion = findConnectedRegion(exitRegion);
    if (!nextRegion) return; // no connection in that direction

    // Place the player at the new region's start position
    const meta = MapMeta[nextRegion];
    if (meta && meta.playerStart) {
        player.tileX = meta.playerStart.x;
        player.tileY = meta.playerStart.y;
        player.x = player.tileX * 32;
        player.y = player.tileY * 32;
        player.targetX = player.x;
        player.targetY = player.y;
        player.moving = false;
    }

    const overworld = createOverworld(nextRegion);
    game.transitionTo(overworld);

    // Auto-save on region change
    game.save.save(0, buildSaveState());
};

/**
 * OPEN CRYPTIDEX — show the encyclopedia of seen / caught cryptids.
 */
game.onOpenCryptidex = () => {
    const cryptidexScene = new CryptidexScene(
        Cryptids,
        game.globalState.cryptidexSeen,
        game.globalState.cryptidexCaught,
        () => { game.popScene(); },
    );
    game.pushScene(cryptidexScene);
};

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
const loadingEl = document.getElementById('loading');
if (loadingEl) {
    loadingEl.classList.add('hidden');
}

game.pushScene(new TitleScene());
game.start();
