const SAVE_KEY = 'cryptidmon_save';
const SAVE_VERSION = 1;

export class SaveManager {
    constructor() {
        this.slots = [null, null, null];
        this.loadSlotInfo();
    }

    loadSlotInfo() {
        for (let i = 0; i < 3; i++) {
            try {
                const raw = localStorage.getItem(`${SAVE_KEY}_${i}`);
                if (raw) {
                    const data = JSON.parse(raw);
                    this.slots[i] = {
                        playerName: data.playerName,
                        playTime: data.playTime,
                        region: data.currentRegion,
                        badges: data.badges?.length || 0,
                        caught: data.cryptidexCaught?.length || 0,
                        timestamp: data.timestamp,
                    };
                }
            } catch (e) {
                this.slots[i] = null;
            }
        }
    }

    save(slot, gameState) {
        const data = {
            version: SAVE_VERSION,
            timestamp: Date.now(),
            playerName: gameState.playerName,
            playTime: gameState.playTime,
            gold: gameState.gold,
            badges: gameState.badges,
            currentRegion: gameState.currentRegion,
            playerX: gameState.playerX,
            playerY: gameState.playerY,
            party: gameState.party.map(c => this.serializeCryptid(c)),
            inventory: gameState.inventory,
            questStates: gameState.questStates,
            cryptidexSeen: [...gameState.cryptidexSeen],
            cryptidexCaught: [...gameState.cryptidexCaught],
            flags: gameState.flags,
            pcBox: (gameState.pcBox || []).map(c => this.serializeCryptid(c)),
        };
        try {
            localStorage.setItem(`${SAVE_KEY}_${slot}`, JSON.stringify(data));
            this.slots[slot] = {
                playerName: data.playerName,
                playTime: data.playTime,
                region: data.currentRegion,
                badges: data.badges.length,
                caught: data.cryptidexCaught.length,
                timestamp: data.timestamp,
            };
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    }

    load(slot) {
        try {
            const raw = localStorage.getItem(`${SAVE_KEY}_${slot}`);
            if (!raw) return null;
            const data = JSON.parse(raw);
            data.cryptidexSeen = new Set(data.cryptidexSeen);
            data.cryptidexCaught = new Set(data.cryptidexCaught);
            return data;
        } catch (e) {
            console.error('Load failed:', e);
            return null;
        }
    }

    deleteSave(slot) {
        localStorage.removeItem(`${SAVE_KEY}_${slot}`);
        this.slots[slot] = null;
    }

    hasSave(slot) {
        return this.slots[slot] !== null;
    }

    serializeCryptid(c) {
        if (!c) return null;
        return {
            templateId: c.templateId,
            nickname: c.nickname,
            level: c.level,
            xp: c.xp,
            hp: c.hp,
            maxHp: c.maxHp,
            moves: c.moves,
            pp: c.pp,
            status: c.status,
            ivs: c.ivs,
            stats: c.stats,
        };
    }

    formatPlayTime(ms) {
        const secs = Math.floor(ms / 1000);
        const mins = Math.floor(secs / 60);
        const hrs = Math.floor(mins / 60);
        return `${hrs}:${String(mins % 60).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
    }
}
