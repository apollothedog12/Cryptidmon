// Cryptid sprite system - detailed procedural sprites for each cryptid.
// Each cryptid has a unique config describing body, eyes, and feature accents.
// Sprites are drawn with Canvas2D paths so no image assets are needed.

// ---------- low-level helpers ----------
function fill(ctx, color) { ctx.fillStyle = color; ctx.fill(); }
function stroke(ctx, color, w) { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); }
function ellipse(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
function shade(hex, amt) {
    const c = parseInt(hex.slice(1), 16);
    let r = (c >> 16) + amt, g = ((c >> 8) & 0xff) + amt, b = (c & 0xff) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// ---------- feature primitives ----------
function eyes(ctx, x, y, s, color, glow, isBack) {
    if (isBack) return;
    const off = s * 0.18, ey = y - s * 0.05, er = s * 0.09;
    if (glow) {
        ctx.shadowColor = color; ctx.shadowBlur = 8;
    }
    circle(ctx, x - off, ey, er); fill(ctx, '#fff');
    circle(ctx, x + off, ey, er); fill(ctx, '#fff');
    circle(ctx, x - off, ey, er * 0.55); fill(ctx, color);
    circle(ctx, x + off, ey, er * 0.55); fill(ctx, color);
    ctx.shadowBlur = 0;
}
function horns(ctx, x, y, s, color, kind) {
    ctx.fillStyle = color;
    const hy = y - s * 0.45;
    if (kind === 'curved') {
        ctx.beginPath();
        ctx.moveTo(x - s * 0.25, hy); ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.85, x - s * 0.15, y - s * 0.7);
        ctx.closePath(); fill(ctx, color);
        ctx.beginPath();
        ctx.moveTo(x + s * 0.25, hy); ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.85, x + s * 0.15, y - s * 0.7);
        ctx.closePath(); fill(ctx, color);
    } else if (kind === 'antlers') {
        ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, s * 0.06); ctx.lineCap = 'round';
        for (const sgn of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(x + sgn * s * 0.18, hy);
            ctx.lineTo(x + sgn * s * 0.32, y - s * 0.85);
            ctx.moveTo(x + sgn * s * 0.28, y - s * 0.7);
            ctx.lineTo(x + sgn * s * 0.5, y - s * 0.78);
            ctx.moveTo(x + sgn * s * 0.3, y - s * 0.78);
            ctx.lineTo(x + sgn * s * 0.45, y - s * 0.95);
            ctx.stroke();
        }
    } else if (kind === 'spikes') {
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * s * 0.12, y - s * 0.4);
            ctx.lineTo(x + i * s * 0.12 - s * 0.04, y - s * 0.65);
            ctx.lineTo(x + i * s * 0.12 + s * 0.04, y - s * 0.65);
            ctx.closePath(); fill(ctx, color);
        }
    }
}
function wings(ctx, x, y, s, color, kind, animFrame) {
    const flap = Math.sin(animFrame * Math.PI / 2) * s * 0.06;
    ctx.fillStyle = color;
    if (kind === 'moth') {
        for (const sgn of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(x, y - s * 0.1);
            ctx.quadraticCurveTo(x + sgn * s * 0.9, y - s * 0.7 - flap, x + sgn * s * 0.85, y + s * 0.15);
            ctx.quadraticCurveTo(x + sgn * s * 0.4, y + s * 0.2, x, y);
            ctx.closePath(); fill(ctx, color);
            // wing spots
            ctx.fillStyle = '#000';
            circle(ctx, x + sgn * s * 0.55, y - s * 0.2, s * 0.07); ctx.fill();
            ctx.fillStyle = color;
        }
    } else if (kind === 'bat') {
        for (const sgn of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(x, y - s * 0.1);
            ctx.quadraticCurveTo(x + sgn * s * 0.7, y - s * 0.6 - flap, x + sgn * s * 0.95, y - s * 0.1);
            ctx.quadraticCurveTo(x + sgn * s * 0.6, y - s * 0.2, x + sgn * s * 0.7, y + s * 0.1);
            ctx.quadraticCurveTo(x + sgn * s * 0.4, y - s * 0.05, x, y);
            ctx.closePath(); fill(ctx, color);
        }
    } else if (kind === 'feather') {
        for (const sgn of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(x, y - s * 0.1);
            ctx.quadraticCurveTo(x + sgn * s * 0.8, y - s * 0.5 - flap, x + sgn * s * 0.7, y + s * 0.2);
            ctx.quadraticCurveTo(x + sgn * s * 0.3, y + s * 0.1, x, y);
            ctx.closePath(); fill(ctx, color);
        }
    } else if (kind === 'fairy') {
        ctx.globalAlpha = 0.7;
        for (const sgn of [-1, 1]) {
            ellipse(ctx, x + sgn * s * 0.35, y - s * 0.25 - flap, s * 0.3, s * 0.45); fill(ctx, color);
            ellipse(ctx, x + sgn * s * 0.4, y + s * 0.05 - flap, s * 0.22, s * 0.3); fill(ctx, color);
        }
        ctx.globalAlpha = 1;
    }
}
function fangs(ctx, x, y, s) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(x - s * 0.08, y + s * 0.1); ctx.lineTo(x - s * 0.04, y + s * 0.22); ctx.lineTo(x, y + s * 0.1); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + s * 0.08, y + s * 0.1); ctx.lineTo(x + s * 0.04, y + s * 0.22); ctx.lineTo(x, y + s * 0.1); ctx.closePath(); ctx.fill();
}
function tail(ctx, x, y, s, color, kind) {
    ctx.fillStyle = color;
    if (kind === 'serpent') {
        ctx.beginPath();
        ctx.moveTo(x + s * 0.3, y + s * 0.1);
        ctx.quadraticCurveTo(x + s * 0.9, y - s * 0.2, x + s * 0.6, y - s * 0.55);
        ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.1, x + s * 0.3, y + s * 0.3);
        ctx.closePath(); fill(ctx, color);
    } else if (kind === 'fluff') {
        circle(ctx, x + s * 0.32, y + s * 0.15, s * 0.13); ctx.fill();
    } else if (kind === 'spike') {
        ctx.beginPath();
        ctx.moveTo(x + s * 0.25, y); ctx.lineTo(x + s * 0.6, y - s * 0.05); ctx.lineTo(x + s * 0.25, y + s * 0.15);
        ctx.closePath(); ctx.fill();
    }
}
function aura(ctx, x, y, s, color) {
    const g = ctx.createRadialGradient(x, y, s * 0.3, x, y, s * 0.8);
    g.addColorStop(0, color + 'cc'); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; circle(ctx, x, y, s * 0.8); ctx.fill();
}

// ---------- generic body shapes ----------
function bodyBlob(ctx, x, y, s, color) {
    ellipse(ctx, x, y + s * 0.05, s * 0.45, s * 0.42); fill(ctx, color);
    ellipse(ctx, x, y - s * 0.1, s * 0.35, s * 0.32); fill(ctx, shade(color, 20));
}
function bodyTall(ctx, x, y, s, color) {
    ellipse(ctx, x, y + s * 0.15, s * 0.35, s * 0.45); fill(ctx, color);
    circle(ctx, x, y - s * 0.2, s * 0.28); fill(ctx, shade(color, 15));
}
function bodyQuad(ctx, x, y, s, color) {
    ellipse(ctx, x, y + s * 0.1, s * 0.5, s * 0.28); fill(ctx, color);
    circle(ctx, x - s * 0.3, y - s * 0.05, s * 0.22); fill(ctx, shade(color, 15));
    // legs
    ctx.fillStyle = shade(color, -25);
    for (const dx of [-0.3, -0.1, 0.1, 0.3]) {
        ctx.fillRect(x + dx * s, y + s * 0.2, s * 0.07, s * 0.2);
    }
}
function bodySerpent(ctx, x, y, s, color) {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.4, y + s * 0.3);
    ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.1, x - s * 0.15, y - s * 0.05);
    ctx.quadraticCurveTo(x + s * 0.2, y, x + s * 0.4, y + s * 0.25);
    ctx.quadraticCurveTo(x + s * 0.1, y + s * 0.4, x - s * 0.2, y + s * 0.4);
    ctx.closePath(); fill(ctx, color);
    ellipse(ctx, x - s * 0.3, y - s * 0.1, s * 0.22, s * 0.18); fill(ctx, shade(color, 20));
}

// ---------- master config ----------
// shape: blob|tall|quad|serpent
// features: {horns, wings, fangs, tail, aura, glow, accent}
const C = {
    // Sasquatch line - hairy ape, gets bigger/darker
    sasquatch:    { shape: 'tall', color: '#8B6914', eye: '#000', f: { fluff: true } },
    bigfoot:      { shape: 'tall', color: '#6B4F14', eye: '#000', f: { fluff: true, fangs: true } },
    gigantopith:  { shape: 'tall', color: '#4A3510', eye: '#ff4400', f: { fluff: true, fangs: true, glow: true, aura: '#664422' } },
    // Mothman line - moth wings, red eyes
    mothling:     { shape: 'blob', color: '#705898', eye: '#ff0000', f: { wings: 'moth', glow: true } },
    mothman:      { shape: 'tall', color: '#583880', eye: '#ff0000', f: { wings: 'moth', glow: true } },
    mothsovereign:{ shape: 'tall', color: '#402060', eye: '#ff0000', f: { wings: 'moth', glow: true, aura: '#aa0033' } },
    // Chupacabra line - spiked reptile dog
    chupacub:     { shape: 'quad', color: '#8B2020', eye: '#ffaa00', f: { spikes: true, fangs: true } },
    chupacabra:   { shape: 'quad', color: '#6B1010', eye: '#ffaa00', f: { spikes: true, fangs: true, tail: 'spike' } },
    chupaterror:  { shape: 'quad', color: '#500808', eye: '#ff0000', f: { spikes: true, fangs: true, tail: 'spike', glow: true, aura: '#aa1100' } },
    // Nessie line - serpent
    nessling:     { shape: 'serpent', color: '#2060A0', eye: '#ffff00' },
    nessie:       { shape: 'serpent', color: '#184880', eye: '#ffff00', f: { tail: 'serpent' } },
    leviathan:    { shape: 'serpent', color: '#103060', eye: '#00ffff', f: { tail: 'serpent', spikes: true, aura: '#0044aa' } },
    // Jackalope line - antlered hare
    jackalkit:    { shape: 'blob', color: '#C4A86E', eye: '#000', f: { antlers: true, ears: true } },
    jackalope:    { shape: 'blob', color: '#A88A50', eye: '#000', f: { antlers: true, ears: true, tail: 'fluff' } },
    wolpertinger: { shape: 'blob', color: '#8A6E38', eye: '#ffaa00', f: { antlers: true, ears: true, tail: 'fluff', wings: 'feather', fangs: true } },
    // Spring-Heeled Jack line - leaping electric imp
    springheel:   { shape: 'tall', color: '#2A8A8A', eye: '#ffff00', f: { spark: true } },
    springjack:   { shape: 'tall', color: '#1A6A6A', eye: '#ffff00', f: { spark: true, fangs: true } },
    springterror: { shape: 'tall', color: '#0A4A4A', eye: '#ffff44', f: { spark: true, fangs: true, glow: true, aura: '#44ffff' } },
    // Yeti line - white ape ice
    yetling:      { shape: 'tall', color: '#e8f4ff', eye: '#0088ff', f: { fluff: true, ice: true } },
    yeti:         { shape: 'tall', color: '#c8e0f4', eye: '#0066cc', f: { fluff: true, ice: true, fangs: true } },
    abominox:     { shape: 'tall', color: '#a8c4e0', eye: '#00ccff', f: { fluff: true, ice: true, fangs: true, aura: '#aaccff' } },
    // Thunderbird line
    thunderkit:   { shape: 'blob', color: '#aa6600', eye: '#ffff00', f: { wings: 'feather', spark: true } },
    thunderbird:  { shape: 'tall', color: '#884400', eye: '#ffff00', f: { wings: 'feather', spark: true, fangs: false } },
    tempestrix:   { shape: 'tall', color: '#552200', eye: '#ffffff', f: { wings: 'feather', spark: true, glow: true, aura: '#ffff00' } },
    // Wendigo line - skeletal antlered
    wendling:     { shape: 'tall', color: '#665544', eye: '#ff0000', f: { antlers: true } },
    wendigo:      { shape: 'tall', color: '#443322', eye: '#ff0000', f: { antlers: true, fangs: true, ribs: true } },
    frostbane:    { shape: 'tall', color: '#221100', eye: '#ff0000', f: { antlers: true, fangs: true, ribs: true, ice: true, aura: '#aaccff' } },
    // Fairy line
    fairyfly:     { shape: 'blob', color: '#ffccee', eye: '#88ff88', f: { wings: 'fairy', glow: true } },
    faerielight:  { shape: 'tall', color: '#ffaaee', eye: '#88ff88', f: { wings: 'fairy', glow: true, aura: '#ffccff' } },
    willowisp:    { shape: 'blob', color: '#ccffaa', eye: '#ffffff', f: { glow: true, aura: '#ccffaa', orb: true } },
    // Skinwalker line - shifting shadow
    skinpup:      { shape: 'quad', color: '#332233', eye: '#ff44ff', f: { fangs: true } },
    skinwalker:   { shape: 'tall', color: '#221122', eye: '#ff44ff', f: { fangs: true, antlers: true } },
    shapelord:    { shape: 'tall', color: '#110011', eye: '#ff00ff', f: { fangs: true, antlers: true, aura: '#660066', glow: true } },
    // Bunny fire line
    bunnyflame:   { shape: 'blob', color: '#ff8844', eye: '#ffff00', f: { ears: true, tail: 'fluff', flame: true } },
    bunnyburn:    { shape: 'blob', color: '#ff5522', eye: '#ffff00', f: { ears: true, tail: 'fluff', flame: true, fangs: true } },
    infernohare:  { shape: 'tall', color: '#cc2200', eye: '#ffffff', f: { ears: true, tail: 'fluff', flame: true, fangs: true, aura: '#ff4400' } },
    // Mossback line - turtle
    mossling:     { shape: 'blob', color: '#558833', eye: '#000', f: { shell: true } },
    mossback:     { shape: 'blob', color: '#446622', eye: '#000', f: { shell: true, vines: true } },
    greenman:     { shape: 'tall', color: '#334411', eye: '#88ff00', f: { vines: true, antlers: true, aura: '#88ff44' } },
    // Selkie line - seal
    tidepup:      { shape: 'blob', color: '#6688aa', eye: '#000', f: { fins: true } },
    tidewalker:   { shape: 'tall', color: '#446688', eye: '#000', f: { fins: true, fangs: true } },
    selkielord:   { shape: 'tall', color: '#224466', eye: '#88ccff', f: { fins: true, fangs: true, aura: '#4488cc' } },
    // Spark fae - electric
    sparkpix:     { shape: 'blob', color: '#ffff88', eye: '#ffffff', f: { wings: 'fairy', spark: true, glow: true } },
    sparkfae:     { shape: 'tall', color: '#ffee44', eye: '#ffffff', f: { wings: 'fairy', spark: true, glow: true } },
    luminarch:    { shape: 'tall', color: '#ffcc00', eye: '#ffffff', f: { wings: 'fairy', spark: true, glow: true, aura: '#ffff88' } },
    // Ash imp line - fire
    ashimp:       { shape: 'blob', color: '#444444', eye: '#ff4400', f: { flame: true, horns: 'curved' } },
    ashfiend:     { shape: 'tall', color: '#332222', eye: '#ff4400', f: { flame: true, horns: 'curved', fangs: true } },
    volcanox:     { shape: 'tall', color: '#221111', eye: '#ffaa00', f: { flame: true, horns: 'curved', fangs: true, aura: '#ff4400' } },
    // Wind line
    gustling:     { shape: 'blob', color: '#cceeff', eye: '#ffffff', f: { swirl: true } },
    dustdevil:    { shape: 'tall', color: '#aaccdd', eye: '#ffffff', f: { swirl: true } },
    tornadox:     { shape: 'tall', color: '#88aacc', eye: '#ffffff', f: { swirl: true, aura: '#cceeff' } },
    // Crystal wolf
    crystalpup:   { shape: 'quad', color: '#ddccff', eye: '#aa00ff', f: { crystal: true } },
    crystalwolf:  { shape: 'quad', color: '#bb99ee', eye: '#aa00ff', f: { crystal: true, fangs: true } },
    aurorex:      { shape: 'quad', color: '#9966cc', eye: '#ff00ff', f: { crystal: true, fangs: true, aura: '#cc88ff' } },
    // Bog line
    boggart:      { shape: 'blob', color: '#557744', eye: '#ffff44', f: { fangs: true } },
    bogwitch:     { shape: 'tall', color: '#446633', eye: '#ffff44', f: { fangs: true, vines: true } },
    swamplord:    { shape: 'tall', color: '#334422', eye: '#aaff00', f: { fangs: true, vines: true, aura: '#557722' } },
    // Sand scorpion
    sandskitter:  { shape: 'quad', color: '#ddbb77', eye: '#000', f: { claws: true } },
    sandclaw:     { shape: 'quad', color: '#bb9955', eye: '#000', f: { claws: true, tail: 'spike' } },
    scorpius:     { shape: 'quad', color: '#998833', eye: '#ff0000', f: { claws: true, tail: 'spike', aura: '#ddaa44' } },
    // Storm eel
    stormeel:     { shape: 'serpent', color: '#4466aa', eye: '#ffff00', f: { spark: true } },
    stormserpent: { shape: 'serpent', color: '#334488', eye: '#ffff00', f: { spark: true, tail: 'serpent' } },
    tempesteel:   { shape: 'serpent', color: '#222266', eye: '#ffffff', f: { spark: true, tail: 'serpent', aura: '#4488ff' } },
    // Owl line
    nightowl:     { shape: 'blob', color: '#665544', eye: '#ffaa00', f: { wings: 'feather', ears: true } },
    owlshade:     { shape: 'tall', color: '#443322', eye: '#ffaa00', f: { wings: 'feather', ears: true, fangs: true } },
    owlterror:    { shape: 'tall', color: '#221100', eye: '#ff0000', f: { wings: 'feather', ears: true, fangs: true, aura: '#330066' } },
    // Vine line
    vinecrawl:    { shape: 'serpent', color: '#446622', eye: '#88ff00', f: { vines: true } },
    vinewraith:   { shape: 'serpent', color: '#335511', eye: '#88ff00', f: { vines: true, fangs: true } },
    thornlord:    { shape: 'tall', color: '#224400', eye: '#aaff00', f: { vines: true, fangs: true, spikes: true, aura: '#446622' } },
    // Frost wolf
    frostfang:    { shape: 'quad', color: '#ddeeff', eye: '#0088ff', f: { fangs: true, ice: true } },
    frostwolf:    { shape: 'quad', color: '#bbccee', eye: '#0088ff', f: { fangs: true, ice: true, fluff: true } },
    glacialbane:  { shape: 'quad', color: '#99aacc', eye: '#00ccff', f: { fangs: true, ice: true, fluff: true, aura: '#aaccff' } },
    // Legendaries
    jerseydevil:  { shape: 'tall', color: '#552233', eye: '#ff0000', f: { wings: 'bat', horns: 'curved', fangs: true, tail: 'spike', aura: '#aa0033', glow: true } },
    flatwoods:    { shape: 'tall', color: '#225544', eye: '#ff8800', f: { glow: true, aura: '#44ffaa', orb: true } },
    fresnocrawler:{ shape: 'tall', color: '#eeeeee', eye: '#000', f: { thin: true, fangs: false } },
    ogopogo:      { shape: 'serpent', color: '#225588', eye: '#88ffff', f: { tail: 'serpent', spikes: true, aura: '#4488cc' } },
};

// ---------- accent painters ----------
function paintAccents(ctx, x, y, s, cfg, isBack, animFrame) {
    const f = cfg.f || {};
    if (f.aura) aura(ctx, x, y, s, f.aura);
    if (f.wings) wings(ctx, x, y, s, shade(cfg.color, -20), f.wings, animFrame);
    if (f.shell) {
        ellipse(ctx, x, y + s * 0.05, s * 0.5, s * 0.4); fill(ctx, shade(cfg.color, -30));
        for (let i = -1; i <= 1; i++) { circle(ctx, x + i * s * 0.18, y, s * 0.08); fill(ctx, shade(cfg.color, -50)); }
    }
}
function paintTopFeatures(ctx, x, y, s, cfg, isBack, animFrame) {
    const f = cfg.f || {};
    if (f.ears) {
        for (const sgn of [-1, 1]) {
            ellipse(ctx, x + sgn * s * 0.18, y - s * 0.4, s * 0.06, s * 0.2); fill(ctx, shade(cfg.color, -20));
        }
    }
    if (f.antlers) horns(ctx, x, y, s, '#aa8855', 'antlers');
    if (f.horns) horns(ctx, x, y, s, '#222', f.horns);
    if (f.spikes && cfg.shape !== 'tall') {
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * s * 0.1, y - s * 0.2);
            ctx.lineTo(x + i * s * 0.1, y - s * 0.4);
            ctx.lineWidth = 2; ctx.strokeStyle = '#222'; ctx.stroke();
        }
    }
    if (f.crystal) {
        for (const sgn of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(x + sgn * s * 0.15, y - s * 0.3);
            ctx.lineTo(x + sgn * s * 0.25, y - s * 0.55);
            ctx.lineTo(x + sgn * s * 0.05, y - s * 0.45);
            ctx.closePath(); fill(ctx, '#ddccff');
        }
    }
    if (f.flame) {
        const fy = y - s * 0.45 + Math.sin(animFrame) * 2;
        ctx.beginPath();
        ctx.moveTo(x - s * 0.15, y - s * 0.25);
        ctx.quadraticCurveTo(x, fy - s * 0.2, x + s * 0.15, y - s * 0.25);
        ctx.quadraticCurveTo(x, y - s * 0.1, x - s * 0.15, y - s * 0.25);
        ctx.closePath(); fill(ctx, '#ffaa00');
    }
    if (f.spark) {
        ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const a = (animFrame + i) * 0.7;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * s * 0.4, y + Math.sin(a) * s * 0.3);
            ctx.lineTo(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.45);
            ctx.stroke();
        }
    }
    if (f.ice) {
        ctx.fillStyle = '#cceeff';
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * s * 0.2, y + s * 0.3);
            ctx.lineTo(x + i * s * 0.2 - s * 0.04, y + s * 0.45);
            ctx.lineTo(x + i * s * 0.2 + s * 0.04, y + s * 0.45);
            ctx.closePath(); ctx.fill();
        }
    }
    if (f.swirl) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 3; a += 0.3) {
            const r = a * s * 0.05;
            const px = x + Math.cos(a + animFrame * 0.5) * r;
            const py = y + Math.sin(a + animFrame * 0.5) * r;
            if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
    if (f.vines) {
        ctx.strokeStyle = '#558833'; ctx.lineWidth = 2;
        for (const sgn of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(x + sgn * s * 0.2, y - s * 0.3);
            ctx.quadraticCurveTo(x + sgn * s * 0.5, y - s * 0.45, x + sgn * s * 0.4, y - s * 0.6);
            ctx.stroke();
        }
    }
    if (f.claws) {
        ctx.fillStyle = '#222';
        for (const sgn of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(x + sgn * s * 0.5, y);
            ctx.lineTo(x + sgn * s * 0.7, y - s * 0.1);
            ctx.lineTo(x + sgn * s * 0.55, y + s * 0.1);
            ctx.closePath(); ctx.fill();
        }
    }
    if (f.fins) {
        ctx.fillStyle = shade(cfg.color, -30);
        for (const sgn of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(x + sgn * s * 0.3, y);
            ctx.lineTo(x + sgn * s * 0.5, y + s * 0.15);
            ctx.lineTo(x + sgn * s * 0.3, y + s * 0.2);
            ctx.closePath(); ctx.fill();
        }
    }
    if (f.ribs) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            const ry = y + (i - 1) * s * 0.1;
            ctx.beginPath(); ctx.moveTo(x - s * 0.2, ry); ctx.lineTo(x + s * 0.2, ry); ctx.stroke();
        }
    }
    if (f.orb) {
        circle(ctx, x, y - s * 0.1, s * 0.2); fill(ctx, '#fff');
        ctx.globalAlpha = 0.5; circle(ctx, x, y - s * 0.1, s * 0.3); fill(ctx, cfg.f.aura || '#fff'); ctx.globalAlpha = 1;
    }
    if (f.tail) tail(ctx, x, y, s, cfg.color, f.tail);
    if (f.fangs && !isBack) fangs(ctx, x, y, s);
}

function drawOne(ctx, cfg, x, y, s, isBack, animFrame) {
    paintAccents(ctx, x, y, s, cfg, isBack, animFrame);
    if (cfg.shape === 'tall') bodyTall(ctx, x, y, s, cfg.color);
    else if (cfg.shape === 'quad') bodyQuad(ctx, x, y, s, cfg.color);
    else if (cfg.shape === 'serpent') bodySerpent(ctx, x, y, s, cfg.color);
    else bodyBlob(ctx, x, y, s, cfg.color);
    eyes(ctx, x, y, s, cfg.eye || '#000', (cfg.f && cfg.f.glow), isBack);
    paintTopFeatures(ctx, x, y, s, cfg, isBack, animFrame);
}

export function hasCryptidSprite(id) {
    return !!C[id];
}

export function drawCryptidSprite(ctx, id, x, y, size, isBack = false, animFrame = 0) {
    const cfg = C[id];
    if (!cfg) return false;
    ctx.save();
    // Reset any leaked state
    ctx.shadowBlur = 0;
    ctx.globalAlpha = ctx.globalAlpha || 1;
    if (isBack) { ctx.translate(x * 2, 0); ctx.scale(-1, 1); }
    try {
        drawOne(ctx, cfg, x, y, size, isBack, animFrame);
    } finally {
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    return true;
}
