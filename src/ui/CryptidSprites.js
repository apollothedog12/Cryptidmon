// Cryptid sprite system - detailed procedural sprites for each cryptid
// This module will be populated with unique sprite rendering functions

export const sprites = {};

// Default fallback - will be replaced with unique sprites per cryptid
function drawDefault(ctx, x, y, size, id, isBack) {
    // Generic creature shape as fallback
}

export function drawCryptidSprite(ctx, id, x, y, size, isBack = false, animFrame = 0) {
    const draw = sprites[id];
    if (draw) {
        ctx.save();
        draw(ctx, x, y, size, isBack, animFrame);
        ctx.restore();
    }
    // If no custom sprite, return without drawing - Canvas.js fallback handles it
}
