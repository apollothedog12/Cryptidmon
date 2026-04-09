import { TILE_SIZE, MAX_PARTY_SIZE } from '../utils/constants.js';

export class Player {
    constructor(x, y) {
        this.x = x * TILE_SIZE;
        this.y = y * TILE_SIZE;
        this.tileX = x;
        this.tileY = y;
        this.targetX = this.x;
        this.targetY = this.y;
        this.moving = false;
        this.direction = 'down'; // up, down, left, right
        this.moveSpeed = 120; // pixels per second
        this.stepCount = 0;
        this.sprite = '#3498db';
        this.party = [];
        this.inventory = {};
        this.pcBox = [];
        this.hasBike = false;
        this.onBike = false;

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;
    }

    get screenWidth() { return TILE_SIZE; }
    get screenHeight() { return TILE_SIZE; }

    addToParty(cryptid) {
        if (this.party.length < MAX_PARTY_SIZE) {
            this.party.push(cryptid);
            return true;
        }
        this.pcBox.push(cryptid);
        return false; // Sent to PC
    }

    getFirstAlive() {
        return this.party.find(c => !c.isFainted);
    }

    hasAliveCryptid() {
        return this.party.some(c => !c.isFainted);
    }

    healAll() {
        for (const c of this.party) {
            c.fullHeal();
        }
    }

    addItem(itemId, count = 1) {
        this.inventory[itemId] = (this.inventory[itemId] || 0) + count;
    }

    removeItem(itemId, count = 1) {
        if (!this.inventory[itemId] || this.inventory[itemId] < count) return false;
        this.inventory[itemId] -= count;
        if (this.inventory[itemId] <= 0) delete this.inventory[itemId];
        return true;
    }

    hasItem(itemId) {
        return (this.inventory[itemId] || 0) > 0;
    }

    getItemCount(itemId) {
        return this.inventory[itemId] || 0;
    }

    update(dt, input, collisionCheck) {
        if (this.moving) {
            const speed = (this.onBike ? this.moveSpeed * 2 : this.moveSpeed) * (dt / 1000);
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;

            if (Math.abs(dx) > speed) {
                this.x += Math.sign(dx) * speed;
            } else {
                this.x = this.targetX;
            }
            if (Math.abs(dy) > speed) {
                this.y += Math.sign(dy) * speed;
            } else {
                this.y = this.targetY;
            }

            if (this.x === this.targetX && this.y === this.targetY) {
                this.moving = false;
                this.tileX = Math.round(this.x / TILE_SIZE);
                this.tileY = Math.round(this.y / TILE_SIZE);
                this.stepCount++;
            }

            // Animation
            this.animTimer += dt;
            if (this.animTimer > 150) {
                this.animFrame = (this.animFrame + 1) % 4;
                this.animTimer = 0;
            }
        } else {
            this.animFrame = 0;
            // Check for new movement input
            if (input.direction.x !== 0 || input.direction.y !== 0) {
                let dx = 0, dy = 0;
                // Prioritize one direction
                if (Math.abs(input.direction.x) >= Math.abs(input.direction.y)) {
                    dx = Math.sign(input.direction.x);
                    this.direction = dx > 0 ? 'right' : 'left';
                } else {
                    dy = Math.sign(input.direction.y);
                    this.direction = dy > 0 ? 'down' : 'up';
                }

                const newTileX = this.tileX + dx;
                const newTileY = this.tileY + dy;

                if (!collisionCheck(newTileX, newTileY)) {
                    this.targetX = newTileX * TILE_SIZE;
                    this.targetY = newTileY * TILE_SIZE;
                    this.moving = true;
                }
            }
        }
    }

    render(canvas) {
        const ctx = canvas.ctx;
        const drawX = this.x - canvas.camera.x + canvas.shake.x;
        const drawY = this.y - canvas.camera.y + canvas.shake.y;
        const cx = drawX + TILE_SIZE / 2;

        // Shadow (stretches with bike)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(cx, drawY + TILE_SIZE - 2, 10, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Walking bob
        const bob = this.moving ? Math.sin(this.animFrame * Math.PI / 2) * 2 : 0;
        const stepOffset = this.moving ? (this.animFrame % 2 === 0 ? 1 : -1) : 0;

        // Legs
        ctx.fillStyle = '#2a2850';
        ctx.fillRect(drawX + 10, drawY + 24, 4, 5 + stepOffset);
        ctx.fillRect(drawX + 18, drawY + 24, 4, 5 - stepOffset);
        // Boots
        ctx.fillStyle = '#1a1018';
        ctx.fillRect(drawX + 9, drawY + 28, 5, 2);
        ctx.fillRect(drawX + 18, drawY + 28, 5, 2);

        // Body - layered jacket
        ctx.fillStyle = '#2d7acc';
        ctx.fillRect(drawX + 6, drawY + 14 - bob, TILE_SIZE - 12, 11);
        // Darker side
        ctx.fillStyle = '#1e5a9a';
        ctx.fillRect(drawX + 6, drawY + 22 - bob, TILE_SIZE - 12, 3);
        // Center stripe
        ctx.fillStyle = '#ffd54f';
        ctx.fillRect(drawX + 15, drawY + 14 - bob, 2, 11);
        // Belt
        ctx.fillStyle = '#4a3018';
        ctx.fillRect(drawX + 6, drawY + 23 - bob, TILE_SIZE - 12, 2);
        // Buckle
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(drawX + 15, drawY + 23 - bob, 2, 2);

        // Arms
        ctx.fillStyle = '#2d7acc';
        ctx.fillRect(drawX + 4, drawY + 15 - bob, 3, 8);
        ctx.fillRect(drawX + 25, drawY + 15 - bob, 3, 8);
        // Hands
        ctx.fillStyle = '#f5cba7';
        ctx.fillRect(drawX + 4, drawY + 22 - bob, 3, 2);
        ctx.fillRect(drawX + 25, drawY + 22 - bob, 3, 2);

        // Head
        ctx.fillStyle = '#f5cba7';
        ctx.beginPath();
        ctx.arc(cx, drawY + 9 - bob, 7, 0, Math.PI * 2);
        ctx.fill();
        // Cheek shading
        ctx.fillStyle = 'rgba(220, 140, 100, 0.5)';
        ctx.fillRect(cx - 5, drawY + 11 - bob, 2, 1);
        ctx.fillRect(cx + 3, drawY + 11 - bob, 2, 1);

        // Hair showing under cap
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(drawX + 9, drawY + 5 - bob, 14, 2);

        // Cap
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(cx, drawY + 4 - bob, 7, Math.PI, 0);
        ctx.fill();
        // Cap band
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(drawX + 8, drawY + 3 - bob, 16, 2);
        // Cap brim (direction-aware)
        ctx.fillStyle = '#b71c1c';
        if (this.direction === 'right') ctx.fillRect(cx + 3, drawY + 4 - bob, 6, 2);
        else if (this.direction === 'left') ctx.fillRect(cx - 9, drawY + 4 - bob, 6, 2);
        else if (this.direction === 'down') ctx.fillRect(cx - 3, drawY + 5 - bob, 6, 2);
        // Cap logo
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(cx - 1, drawY - bob, 2, 2);

        // Eyes (direction-aware)
        ctx.fillStyle = '#111';
        const eyeOffsets = {
            down: [[-3, 0], [2, 0]],
            up: [[-3, -2], [2, -2]],
            left: [[-4, -1], [-1, -1]],
            right: [[1, -1], [4, -1]],
        };
        const eyes = eyeOffsets[this.direction];
        for (const [ex, ey] of eyes) {
            ctx.fillRect(cx + ex, drawY + 9 + ey - bob, 2, 2);
        }
    }
}
