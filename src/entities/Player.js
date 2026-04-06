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
        const drawX = this.x - canvas.camera.x + canvas.shake.x;
        const drawY = this.y - canvas.camera.y + canvas.shake.y;

        // Shadow
        canvas.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        canvas.ctx.beginPath();
        canvas.ctx.ellipse(drawX + TILE_SIZE / 2, drawY + TILE_SIZE - 2, 10, 4, 0, 0, Math.PI * 2);
        canvas.ctx.fill();

        // Body
        const bob = this.moving ? Math.sin(this.animFrame * Math.PI / 2) * 2 : 0;
        canvas.ctx.fillStyle = this.sprite;
        canvas.ctx.fillRect(drawX + 6, drawY + 8 - bob, TILE_SIZE - 12, TILE_SIZE - 10);

        // Head
        canvas.ctx.fillStyle = '#f5cba7';
        canvas.ctx.beginPath();
        canvas.ctx.arc(drawX + TILE_SIZE / 2, drawY + 8 - bob, 8, 0, Math.PI * 2);
        canvas.ctx.fill();

        // Hat
        canvas.ctx.fillStyle = '#e74c3c';
        canvas.ctx.fillRect(drawX + 5, drawY - 1 - bob, TILE_SIZE - 10, 6);

        // Direction indicator (eyes)
        canvas.ctx.fillStyle = '#111';
        const eyeOffsets = {
            down: [[-3, 0], [3, 0]],
            up: [[-3, -2], [3, -2]],
            left: [[-4, -1], [-1, -1]],
            right: [[1, -1], [4, -1]],
        };
        const eyes = eyeOffsets[this.direction];
        for (const [ex, ey] of eyes) {
            canvas.ctx.fillRect(drawX + TILE_SIZE / 2 + ex - 1, drawY + 8 + ey - bob - 1, 2, 2);
        }
    }
}
