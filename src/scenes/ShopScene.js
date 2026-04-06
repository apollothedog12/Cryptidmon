import { SCREEN_W, SCREEN_H, COLORS, TYPE_COLORS } from '../utils/constants.js';

export class ShopScene {
    constructor(shopItems, player, onClose) {
        this.game = null;
        this.canvas = null;
        this.input = null;
        this.shopItems = shopItems; // array of {id, name, type, price, description}
        this.player = player;
        this.onClose = onClose;

        this.mode = 0; // 0 = Buy, 1 = Sell
        this.modeLabels = ['Buy', 'Sell'];
        this.listIndex = 0;
        this.scrollOffset = 0;
        this.maxVisible = 8;

        this.message = null;
        this.messageTimer = 0;

        // Navigation debounce
        this._prevLeft = false;
        this._prevRight = false;
        this._prevUp = false;
        this._prevDown = false;

        this.timer = 0;
    }

    enter() {
        this.mode = 0;
        this.listIndex = 0;
        this.scrollOffset = 0;
        this.message = null;
        this.messageTimer = 0;
        this.timer = 0;
    }

    exit() {}
    resume() {}

    get gold() {
        return this.game.globalState.gold || 0;
    }

    set gold(val) {
        this.game.globalState.gold = val;
    }

    getBuyItems() {
        return this.shopItems;
    }

    getSellItems() {
        const items = [];
        for (const [itemId, count] of Object.entries(this.player.inventory)) {
            if (count > 0) {
                // Find matching shop data or build from inventory
                const shopData = this.shopItems.find(s => s.id === itemId);
                items.push({
                    id: itemId,
                    name: shopData ? shopData.name : itemId,
                    type: shopData ? shopData.type : 'misc',
                    price: shopData ? Math.floor(shopData.price / 2) : 1,
                    description: shopData ? shopData.description : '',
                    count,
                });
            }
        }
        return items;
    }

    getCurrentList() {
        return this.mode === 0 ? this.getBuyItems() : this.getSellItems();
    }

    showMessage(text) {
        this.message = text;
        this.messageTimer = 1500;
    }

    update(dt) {
        this.timer += dt;

        if (this.messageTimer > 0) {
            this.messageTimer -= dt;
            if (this.messageTimer <= 0) {
                this.message = null;
            }
        }

        const leftPressed = this.input.direction.x < 0;
        const rightPressed = this.input.direction.x > 0;
        const upPressed = this.input.direction.y < 0;
        const downPressed = this.input.direction.y > 0;

        // Cancel exits shop
        if (this.input.cancelJustPressed) {
            if (this.onClose) {
                this.onClose();
            }
            this.game.popScene();
            return;
        }

        // Mode toggle with left/right
        if (leftPressed && !this._prevLeft) {
            this.mode = (this.mode - 1 + 2) % 2;
            this.listIndex = 0;
            this.scrollOffset = 0;
        }
        if (rightPressed && !this._prevRight) {
            this.mode = (this.mode + 1) % 2;
            this.listIndex = 0;
            this.scrollOffset = 0;
        }

        // List navigation
        const list = this.getCurrentList();
        const listLen = list.length;

        if (upPressed && !this._prevUp) {
            if (listLen > 0) {
                this.listIndex = (this.listIndex - 1 + listLen) % listLen;
            }
        }
        if (downPressed && !this._prevDown) {
            if (listLen > 0) {
                this.listIndex = (this.listIndex + 1) % listLen;
            }
        }

        // Keep scroll in view
        if (this.listIndex < this.scrollOffset) {
            this.scrollOffset = this.listIndex;
        }
        if (this.listIndex >= this.scrollOffset + this.maxVisible) {
            this.scrollOffset = this.listIndex - this.maxVisible + 1;
        }

        this._prevLeft = leftPressed;
        this._prevRight = rightPressed;
        this._prevUp = upPressed;
        this._prevDown = downPressed;

        // Action: buy or sell
        if (this.input.actionJustPressed) {
            if (this.mode === 0) {
                this.handleBuy();
            } else {
                this.handleSell();
            }
        }
    }

    handleBuy() {
        const list = this.getBuyItems();
        if (list.length === 0 || this.listIndex >= list.length) return;

        const item = list[this.listIndex];
        if (this.gold < item.price) {
            this.showMessage('Not enough gold!');
            return;
        }

        this.gold -= item.price;
        if (!this.player.inventory[item.id]) {
            this.player.inventory[item.id] = 0;
        }
        this.player.inventory[item.id]++;
        this.showMessage(`Bought ${item.name}!`);
    }

    handleSell() {
        const list = this.getSellItems();
        if (list.length === 0 || this.listIndex >= list.length) return;

        const item = list[this.listIndex];
        if (!this.player.inventory[item.id] || this.player.inventory[item.id] <= 0) {
            this.showMessage('No items to sell!');
            return;
        }

        this.player.inventory[item.id]--;
        this.gold += item.price;
        this.showMessage(`Sold ${item.name} for ${item.price}G!`);

        // If item count reaches 0, adjust list index
        if (this.player.inventory[item.id] <= 0) {
            delete this.player.inventory[item.id];
            const newList = this.getSellItems();
            if (this.listIndex >= newList.length) {
                this.listIndex = Math.max(0, newList.length - 1);
            }
        }
    }

    render(canvas) {
        // Background
        canvas.fill(COLORS.bg);

        // Shop panel
        const panelX = 16;
        const panelY = 12;
        const panelW = SCREEN_W - 32;
        const panelH = SCREEN_H - 24;
        canvas.drawRectUI(panelX, panelY, panelW, panelH, 'rgba(10,10,35,0.95)');
        canvas.drawRectOutlineUI(panelX, panelY, panelW, panelH, '#ff6b35', 2);

        // Title
        canvas.drawTextShadow('SHOP', panelX + 16, panelY + 8, '#ff6b35', 18);

        // Gold display at top right
        const goldText = `Gold: ${this.gold}G`;
        canvas.drawRectUI(panelX + panelW - 130, panelY + 4, 120, 22, 'rgba(255,215,0,0.12)');
        canvas.drawRectOutlineUI(panelX + panelW - 130, panelY + 4, 120, 22, 'rgba(255,215,0,0.3)', 1);
        canvas.drawTextShadow(goldText, panelX + panelW - 70, panelY + 8, '#ffd700', 13, 'center');

        // Mode tabs
        this.renderModeTabs(canvas, panelX, panelY + 30, panelW);

        // Divider
        canvas.drawRectUI(panelX, panelY + 54, panelW, 1, 'rgba(255,255,255,0.15)');

        // Item list
        const listY = panelY + 60;
        const listH = panelH - 110;
        this.renderItemList(canvas, panelX + 8, listY, panelW - 16, listH);

        // Description box at bottom
        this.renderDescription(canvas, panelX + 8, panelY + panelH - 44, panelW - 16);

        // Controls hint
        canvas.drawText('L/R: Buy/Sell   Up/Down: Browse   A: Select   B: Exit', SCREEN_W / 2, SCREEN_H - 6, '#555', 9, 'center');

        // Message popup
        if (this.message) {
            const alpha = Math.min(1, this.messageTimer / 400);
            canvas.setAlpha(alpha);
            canvas.drawRectUI(SCREEN_W / 2 - 90, SCREEN_H / 2 - 16, 180, 32, 'rgba(0,0,0,0.9)');
            canvas.drawRectOutlineUI(SCREEN_W / 2 - 90, SCREEN_H / 2 - 16, 180, 32, '#4caf50', 2);
            canvas.drawTextShadow(this.message, SCREEN_W / 2, SCREEN_H / 2 - 6, '#fff', 13, 'center');
            canvas.resetAlpha();
        }
    }

    renderModeTabs(canvas, x, y, w) {
        const tabW = 80;
        const totalW = tabW * 2 + 8;
        const startX = x + (w - totalW) / 2;

        for (let i = 0; i < 2; i++) {
            const tx = startX + i * (tabW + 8);
            const isActive = i === this.mode;

            if (isActive) {
                canvas.drawRectUI(tx, y, tabW, 22, 'rgba(255,107,53,0.3)');
                canvas.drawRectOutlineUI(tx, y, tabW, 22, '#ff6b35', 1);
                canvas.drawTextShadow(this.modeLabels[i], tx + tabW / 2, y + 4, '#ff6b35', 13, 'center');
            } else {
                canvas.drawRectUI(tx, y, tabW, 22, 'rgba(255,255,255,0.05)');
                canvas.drawRectOutlineUI(tx, y, tabW, 22, 'rgba(255,255,255,0.1)', 1);
                canvas.drawText(this.modeLabels[i], tx + tabW / 2, y + 4, '#777', 12, 'center');
            }
        }
    }

    renderItemList(canvas, x, y, w, h) {
        const list = this.getCurrentList();

        if (list.length === 0) {
            const emptyText = this.mode === 0 ? 'Nothing for sale.' : 'No items to sell.';
            canvas.drawText(emptyText, x + w / 2, y + 40, '#777', 12, 'center');
            return;
        }

        const slotH = 26;
        const endIdx = Math.min(list.length, this.scrollOffset + this.maxVisible);

        for (let i = this.scrollOffset; i < endIdx; i++) {
            const item = list[i];
            const sy = y + (i - this.scrollOffset) * (slotH + 3);
            const isSelected = i === this.listIndex;

            // Row background
            if (isSelected) {
                canvas.drawRectUI(x, sy, w, slotH, 'rgba(255,107,53,0.2)');
                canvas.drawRectOutlineUI(x, sy, w, slotH, '#ff6b35', 1);
            } else {
                canvas.drawRectUI(x, sy, w, slotH, 'rgba(255,255,255,0.03)');
            }

            // Item type color dot
            const typeColor = this.getItemTypeColor(item.type);
            canvas.drawCircleUI(x + 10, sy + slotH / 2, 4, typeColor);

            // Item name
            canvas.drawText(item.name, x + 24, sy + 6, isSelected ? COLORS.white : '#ccc', 11);

            // Count (sell mode)
            if (this.mode === 1 && item.count !== undefined) {
                canvas.drawText(`x${item.count}`, x + w - 110, sy + 6, '#aaa', 10);
            }

            // Price
            const priceColor = this.mode === 0 && this.gold < item.price ? '#f44336' : '#ffd700';
            canvas.drawText(`${item.price}G`, x + w - 40, sy + 6, priceColor, 11, 'right');
        }

        // Scroll indicators
        if (this.scrollOffset > 0) {
            canvas.drawTextShadow('^', x + w / 2, y - 8, '#aaa', 10, 'center');
        }
        if (endIdx < list.length) {
            const bottomY = y + this.maxVisible * (slotH + 3) + 2;
            canvas.drawTextShadow('v', x + w / 2, bottomY, '#aaa', 10, 'center');
        }
    }

    renderDescription(canvas, x, y, w) {
        canvas.drawRectUI(x, y, w, 36, 'rgba(0,0,0,0.4)');
        canvas.drawRectOutlineUI(x, y, w, 36, 'rgba(255,255,255,0.08)', 1);

        const list = this.getCurrentList();
        if (list.length > 0 && this.listIndex < list.length) {
            const item = list[this.listIndex];
            canvas.drawText(item.description || 'No description.', x + 8, y + 6, '#bbb', 10);

            // Show buy/sell hint
            if (this.mode === 0) {
                const canAfford = this.gold >= item.price;
                const hintColor = canAfford ? '#4caf50' : '#f44336';
                const hintText = canAfford ? 'Press A to buy' : 'Cannot afford';
                canvas.drawText(hintText, x + w - 8, y + 6, hintColor, 10, 'right');
            } else {
                canvas.drawText('Press A to sell', x + w - 8, y + 6, '#4caf50', 10, 'right');
            }

            // Item type label
            if (item.type) {
                const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
                canvas.drawText(typeLabel, x + 8, y + 22, '#888', 9);
            }
        }
    }

    getItemTypeColor(type) {
        const typeColors = {
            trap: '#42a5f5',
            potion: '#4caf50',
            status_heal: '#ab47bc',
            battle: '#f44336',
            evolution: '#ff9800',
            key: '#ffd700',
            misc: '#888',
        };
        return typeColors[type] || '#888';
    }
}
