// Rich tile renderer with per-region theming.
// Replaces the flat colored rects in OverworldScene with detailed procedural tiles.

import { TILE_SIZE } from '../utils/constants.js';

// Region palette - controls look and feel per map
export const RegionThemes = {
    pinewatch: {
        grassBase: '#3e7a35', grassHi: '#4d9442', grassLo: '#2e5c27',
        pathBase: '#b89662', pathHi: '#cda878', pathLo: '#8e6c3e',
        treeTrunk: '#4a2c10', treeFoliage: '#245a1c', treeFoliageHi: '#357a28',
        waterBase: '#2e6fb8', waterHi: '#4e8dd4', waterLo: '#1a4a82',
        grassDecor: ['#f4e870', '#ffa5d8', '#f0efe2'], // flowers
        ambient: 'leaves',
        lightTint: 'rgba(255, 240, 180, 0.05)',
    },
    appalachia: {
        grassBase: '#4a6a3a', grassHi: '#618c4c', grassLo: '#33502a',
        pathBase: '#9e8252', pathHi: '#b89a6c', pathLo: '#705a34',
        treeTrunk: '#3c2408', treeFoliage: '#5e6a2a', treeFoliageHi: '#7a8838',
        waterBase: '#3c6a92', waterHi: '#5e8db2', waterLo: '#264a6c',
        grassDecor: ['#e8a832', '#cc6818', '#a23a08'], // autumn leaves
        ambient: 'mist',
        lightTint: 'rgba(180, 160, 200, 0.08)',
    },
    greatplains: {
        grassBase: '#7a8a3a', grassHi: '#9aa84a', grassLo: '#5a6828',
        pathBase: '#c8a560', pathHi: '#e0bd78', pathLo: '#9c7d3e',
        treeTrunk: '#5a3a10', treeFoliage: '#8a8a2a', treeFoliageHi: '#a8a83a',
        waterBase: '#4a7bc8', waterHi: '#6a9ae0', waterLo: '#2e5898',
        grassDecor: ['#ffeb3b', '#ffc107', '#f0f0f0'], // wildflowers
        ambient: 'pollen',
        lightTint: 'rgba(255, 230, 150, 0.07)',
    },
    southwest: {
        grassBase: '#c8a568', grassHi: '#dcb97a', grassLo: '#a88044',
        pathBase: '#b07838', pathHi: '#c48a48', pathLo: '#8a5a22',
        treeTrunk: '#5a3a18', treeFoliage: '#6a8a3a', treeFoliageHi: '#8aa84a', // cacti
        waterBase: '#3a8aa8', waterHi: '#5aaac8', waterLo: '#266a88',
        grassDecor: ['#e8583a', '#f4aa3a', '#f8d030'], // desert flowers
        ambient: 'sand',
        lightTint: 'rgba(255, 180, 80, 0.12)',
    },
    mistyloch: {
        grassBase: '#3a6a5a', grassHi: '#4e8a76', grassLo: '#254a40',
        pathBase: '#8a7a62', pathHi: '#a48e76', pathLo: '#5e5244',
        treeTrunk: '#2c1a08', treeFoliage: '#1e5040', treeFoliageHi: '#2e6a56',
        waterBase: '#2e5a7a', waterHi: '#4a7a9a', waterLo: '#1c3a56',
        grassDecor: ['#b0e8ff', '#d0f0ff', '#ffffff'], // mist droplets
        ambient: 'mist',
        lightTint: 'rgba(180, 200, 230, 0.15)',
    },
    frozenpeak: {
        grassBase: '#d8e4ec', grassHi: '#eef4f8', grassLo: '#a8b8c8',
        pathBase: '#8a9aaa', pathHi: '#a8b8c8', pathLo: '#5a6a7a',
        treeTrunk: '#3a2c1c', treeFoliage: '#2a4a3a', treeFoliageHi: '#4a6a5a',
        waterBase: '#4a8abe', waterHi: '#6aaade', waterLo: '#2e5a88',
        grassDecor: ['#ffffff', '#e0f4ff', '#b8d8ec'], // snow
        ambient: 'snow',
        lightTint: 'rgba(200, 220, 255, 0.12)',
    },
};

export function getTheme(regionId) {
    return RegionThemes[regionId] || RegionThemes.pinewatch;
}

// Deterministic pseudo-random for stable per-tile detail
function rand(x, y, seed = 0) {
    const s = Math.sin(x * 374.123 + y * 817.391 + seed * 51.527) * 43758.5453;
    return s - Math.floor(s);
}

export class TileRenderer {
    constructor(theme) {
        this.theme = theme;
        this.time = 0;
    }

    setTheme(theme) { this.theme = theme; }
    setTime(t) { this.time = t; }

    drawTile(ctx, tile, tx, ty, sx, sy) {
        const t = this.theme;
        const S = TILE_SIZE;

        // All tiles sit on a base ground color so there are no gaps
        if (tile === 1 || tile === 3) {
            // Trees/water still get a darker underlay
            ctx.fillStyle = t.grassLo;
            ctx.fillRect(sx, sy, S, S);
        }

        switch (tile) {
            case 0: return this.drawGrass(ctx, tx, ty, sx, sy, t);
            case 1: return this.drawTree(ctx, tx, ty, sx, sy, t);
            case 2: return this.drawTallGrass(ctx, tx, ty, sx, sy, t);
            case 3: return this.drawWater(ctx, tx, ty, sx, sy, t);
            case 4: return this.drawPath(ctx, tx, ty, sx, sy, t);
            case 5: return this.drawBuilding(ctx, tx, ty, sx, sy, t);
            case 6: return this.drawSign(ctx, tx, ty, sx, sy, t);
            case 7: return this.drawGrass(ctx, tx, ty, sx, sy, t);
            case 8: return this.drawExit(ctx, tx, ty, sx, sy, t);
            case 9: return this.drawLedge(ctx, tx, ty, sx, sy, t);
            default:
                ctx.fillStyle = t.grassBase;
                ctx.fillRect(sx, sy, S, S);
        }
    }

    drawGrass(ctx, tx, ty, sx, sy, t) {
        const S = TILE_SIZE;
        // Base with subtle gradient so tiles don't look flat
        const g = ctx.createLinearGradient(sx, sy, sx, sy + S);
        g.addColorStop(0, t.grassHi);
        g.addColorStop(1, t.grassBase);
        ctx.fillStyle = g;
        ctx.fillRect(sx, sy, S, S);

        // Deterministic flecks - blades of grass / pebbles
        for (let i = 0; i < 4; i++) {
            const rx = rand(tx, ty, i) * (S - 4);
            const ry = rand(tx, ty, i + 10) * (S - 4);
            const dark = rand(tx, ty, i + 20) < 0.5;
            ctx.fillStyle = dark ? t.grassLo : t.grassHi;
            ctx.fillRect(sx + rx, sy + ry, 2, 2);
        }

        // Occasional flower / decor
        const flowerRoll = rand(tx, ty, 99);
        if (flowerRoll > 0.85 && t.grassDecor.length) {
            const color = t.grassDecor[Math.floor(rand(tx, ty, 101) * t.grassDecor.length)];
            const fx = sx + 8 + rand(tx, ty, 102) * 16;
            const fy = sy + 8 + rand(tx, ty, 103) * 16;
            ctx.fillStyle = color;
            ctx.fillRect(fx - 1, fy - 1, 3, 3);
            ctx.fillRect(fx, fy - 2, 1, 1);
            // Stem
            ctx.fillStyle = t.grassLo;
            ctx.fillRect(fx, fy + 1, 1, 2);
        }
    }

    drawTallGrass(ctx, tx, ty, sx, sy, t) {
        const S = TILE_SIZE;
        // Underlying grass
        this.drawGrass(ctx, tx, ty, sx, sy, t);

        // Swaying blades
        const sway = Math.sin(this.time * 0.003 + (tx + ty) * 0.7) * 1.5;
        const blades = [
            { x: 4, h: 12 }, { x: 10, h: 14 }, { x: 15, h: 11 },
            { x: 20, h: 13 }, { x: 25, h: 12 },
        ];
        for (const b of blades) {
            const bx = sx + b.x + sway;
            const by = sy + S - b.h - 4;
            ctx.fillStyle = t.grassLo;
            ctx.fillRect(bx, by, 2, b.h);
            ctx.fillStyle = t.grassHi;
            ctx.fillRect(bx + 1, by, 1, b.h - 2);
        }

        // Rustle marker: tiny dot when encounter-possible
        const sparkle = Math.sin(this.time * 0.005 + tx * 1.3 + ty * 2.1);
        if (sparkle > 0.96) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillRect(sx + S / 2, sy + 4, 2, 2);
        }
    }

    drawTree(ctx, tx, ty, sx, sy, t) {
        const S = TILE_SIZE;
        // Trunk shadow behind
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(sx + S / 2 + 4, sy + S - 4, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk
        ctx.fillStyle = t.treeTrunk;
        ctx.fillRect(sx + 13, sy + 18, 6, 14);

        // Foliage - layered circles
        const rx = rand(tx, ty, 1) * 2 - 1;
        ctx.fillStyle = t.treeFoliage;
        ctx.beginPath(); ctx.arc(sx + 16 + rx, sy + 14, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = t.treeFoliageHi;
        ctx.beginPath(); ctx.arc(sx + 14 + rx, sy + 10, 10, 0, Math.PI * 2); ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.arc(sx + 12 + rx, sy + 8, 4, 0, Math.PI * 2); ctx.fill();

        // Pinewatch / frozen theme: pine silhouette variant sometimes
        if ((this.theme === RegionThemes.pinewatch || this.theme === RegionThemes.frozenpeak) && rand(tx, ty, 5) > 0.55) {
            ctx.fillStyle = t.treeFoliage;
            ctx.beginPath();
            ctx.moveTo(sx + 16, sy + 2);
            ctx.lineTo(sx + 5, sy + 20);
            ctx.lineTo(sx + 27, sy + 20);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = t.treeFoliageHi;
            ctx.beginPath();
            ctx.moveTo(sx + 16, sy + 5);
            ctx.lineTo(sx + 9, sy + 14);
            ctx.lineTo(sx + 23, sy + 14);
            ctx.closePath(); ctx.fill();
            // snow cap in frozen
            if (this.theme === RegionThemes.frozenpeak) {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(sx + 16, sy + 2);
                ctx.lineTo(sx + 11, sy + 11);
                ctx.lineTo(sx + 21, sy + 11);
                ctx.closePath(); ctx.fill();
            }
        }
    }

    drawWater(ctx, tx, ty, sx, sy, t) {
        const S = TILE_SIZE;
        // Gradient base
        const g = ctx.createLinearGradient(sx, sy, sx, sy + S);
        g.addColorStop(0, t.waterHi);
        g.addColorStop(0.5, t.waterBase);
        g.addColorStop(1, t.waterLo);
        ctx.fillStyle = g;
        ctx.fillRect(sx, sy, S, S);

        // Animated waves
        const wave = Math.sin((tx + ty) * 0.5 + this.time * 0.002) * 2;
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(sx + 4, sy + 10 + wave, 10, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(sx + 18, sy + 18 + wave, 8, 2);

        // Sparkle
        const sp = Math.sin(this.time * 0.004 + tx * 1.7 + ty * 2.3);
        if (sp > 0.92) {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillRect(sx + 22, sy + 6, 2, 2);
        }
    }

    drawPath(ctx, tx, ty, sx, sy, t) {
        const S = TILE_SIZE;
        // Dirt gradient
        const g = ctx.createLinearGradient(sx, sy, sx, sy + S);
        g.addColorStop(0, t.pathHi);
        g.addColorStop(1, t.pathBase);
        ctx.fillStyle = g;
        ctx.fillRect(sx, sy, S, S);

        // Scattered pebbles
        for (let i = 0; i < 3; i++) {
            const rx = rand(tx, ty, i + 50) * (S - 4);
            const ry = rand(tx, ty, i + 60) * (S - 4);
            ctx.fillStyle = t.pathLo;
            ctx.fillRect(sx + rx, sy + ry, 2, 2);
            ctx.fillStyle = t.pathHi;
            ctx.fillRect(sx + rx, sy + ry, 1, 1);
        }

        // Edge shadow blend
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(sx, sy, S, 2);
        ctx.fillRect(sx, sy + S - 2, S, 2);
    }

    drawBuilding(ctx, tx, ty, sx, sy, t) {
        const S = TILE_SIZE;
        // Ground underneath
        this.drawPath(ctx, tx, ty, sx, sy, t);

        // Walls
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(sx + 2, sy + 6, S - 4, S - 6);
        // Plank shading
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(sx + 2, sy + 12 + i * 6, S - 4, 1);
        }

        // Roof
        ctx.fillStyle = '#8b3a1e';
        ctx.beginPath();
        ctx.moveTo(sx, sy + 8);
        ctx.lineTo(sx + S / 2, sy);
        ctx.lineTo(sx + S, sy + 8);
        ctx.lineTo(sx + S - 2, sy + 8);
        ctx.lineTo(sx + 2, sy + 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#a84828';
        ctx.beginPath();
        ctx.moveTo(sx + 2, sy + 8);
        ctx.lineTo(sx + S / 2, sy + 2);
        ctx.lineTo(sx + S - 2, sy + 8);
        ctx.closePath();
        ctx.fill();

        // Chimney
        ctx.fillStyle = '#4a2c1a';
        ctx.fillRect(sx + S - 10, sy + 2, 5, 6);
        // Smoke (animated)
        const smokeY = sy - 2 + Math.sin(this.time * 0.003 + tx) * 2;
        ctx.fillStyle = 'rgba(200,200,200,0.5)';
        ctx.beginPath();
        ctx.arc(sx + S - 7, smokeY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Door
        ctx.fillStyle = '#3a1f08';
        ctx.fillRect(sx + 12, sy + 16, 8, 16);
        ctx.fillStyle = '#ffd54f';
        ctx.fillRect(sx + 17, sy + 23, 1, 2);

        // Windows with warm glow
        ctx.fillStyle = '#ffd54f';
        ctx.fillRect(sx + 5, sy + 11, 5, 5);
        ctx.fillRect(sx + S - 10, sy + 11, 5, 5);
        // Frame
        ctx.strokeStyle = '#2a1a08';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 5, sy + 11, 5, 5);
        ctx.strokeRect(sx + S - 10, sy + 11, 5, 5);
        // Cross
        ctx.beginPath();
        ctx.moveTo(sx + 7.5, sy + 11); ctx.lineTo(sx + 7.5, sy + 16);
        ctx.moveTo(sx + 5, sy + 13.5); ctx.lineTo(sx + 10, sy + 13.5);
        ctx.stroke();
    }

    drawSign(ctx, tx, ty, sx, sy, t) {
        const S = TILE_SIZE;
        // Ground
        this.drawGrass(ctx, tx, ty, sx, sy, t);
        // Post
        ctx.fillStyle = '#4a2c10';
        ctx.fillRect(sx + 14, sy + 16, 4, 16);
        // Board
        ctx.fillStyle = '#c49a62';
        ctx.fillRect(sx + 4, sy + 6, S - 8, 14);
        ctx.fillStyle = '#8a6a32';
        ctx.fillRect(sx + 4, sy + 18, S - 8, 2);
        // Lines of "text"
        ctx.fillStyle = '#3a2008';
        ctx.fillRect(sx + 7, sy + 10, 18, 1);
        ctx.fillRect(sx + 7, sy + 13, 14, 1);
        ctx.fillRect(sx + 7, sy + 16, 16, 1);
    }

    drawExit(ctx, tx, ty, sx, sy, t) {
        const S = TILE_SIZE;
        // Path background
        this.drawPath(ctx, tx, ty, sx, sy, t);
        // Glowing portal arrow
        const pulse = (Math.sin(this.time * 0.005) + 1) / 2;
        const glow = ctx.createRadialGradient(sx + S / 2, sy + S / 2, 2, sx + S / 2, sy + S / 2, S / 2);
        glow.addColorStop(0, `rgba(255, 240, 120, ${0.4 + pulse * 0.4})`);
        glow.addColorStop(1, 'rgba(255, 240, 120, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(sx, sy, S, S);
        // Arrow
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(sx + S / 2, sy + 8);
        ctx.lineTo(sx + S - 8, sy + S / 2);
        ctx.lineTo(sx + S / 2 + 4, sy + S / 2);
        ctx.lineTo(sx + S / 2 + 4, sy + S - 8);
        ctx.lineTo(sx + S / 2 - 4, sy + S - 8);
        ctx.lineTo(sx + S / 2 - 4, sy + S / 2);
        ctx.lineTo(sx + 8, sy + S / 2);
        ctx.closePath();
        ctx.fill();
    }

    drawLedge(ctx, tx, ty, sx, sy, t) {
        const S = TILE_SIZE;
        this.drawGrass(ctx, tx, ty, sx, sy, t);
        // Stone ridge
        ctx.fillStyle = '#7a6a4a';
        ctx.fillRect(sx, sy + S - 10, S, 10);
        ctx.fillStyle = '#9a8a5a';
        ctx.fillRect(sx, sy + S - 10, S, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(sx, sy + S - 2, S, 2);
    }
}
