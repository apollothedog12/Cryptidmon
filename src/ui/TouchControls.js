export class TouchControls {
    constructor(input) {
        this.input = input;
        this.visible = false;
        this.container = null;
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

        this._createStyles();
        this._createDOM();

        if (this.isTouchDevice) {
            this.show();
        }
    }

    _createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tc-container {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                pointer-events: none;
                z-index: 1000;
                user-select: none;
                -webkit-user-select: none;
                -webkit-touch-callout: none;
            }
            .tc-container * {
                pointer-events: auto;
            }
            .tc-btn {
                position: absolute;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: monospace;
                font-weight: bold;
                color: rgba(255,255,255,0.85);
                text-shadow: 0 1px 3px rgba(0,0,0,0.6);
                transition: transform 0.06s ease, opacity 0.06s ease;
                touch-action: none;
            }
            .tc-btn.pressed {
                transform: scale(0.88);
                opacity: 0.65;
            }
            .tc-dpad {
                position: absolute;
                border-radius: 50%;
                touch-action: none;
            }
            .tc-dpad-center {
                position: absolute;
                width: 24px; height: 24px;
                border-radius: 50%;
                background: rgba(255,255,255,0.15);
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
            }
            .tc-dpad-arrow {
                position: absolute;
                width: 0; height: 0;
                pointer-events: none;
            }
            .tc-dpad-arrow.up {
                top: 10px; left: 50%;
                transform: translateX(-50%);
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-bottom: 10px solid rgba(255,255,255,0.35);
            }
            .tc-dpad-arrow.down {
                bottom: 10px; left: 50%;
                transform: translateX(-50%);
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 10px solid rgba(255,255,255,0.35);
            }
            .tc-dpad-arrow.left {
                left: 10px; top: 50%;
                transform: translateY(-50%);
                border-top: 8px solid transparent;
                border-bottom: 8px solid transparent;
                border-right: 10px solid rgba(255,255,255,0.35);
            }
            .tc-dpad-arrow.right {
                right: 10px; top: 50%;
                transform: translateY(-50%);
                border-top: 8px solid transparent;
                border-bottom: 8px solid transparent;
                border-left: 10px solid rgba(255,255,255,0.35);
            }
            .tc-menu-btn {
                position: absolute;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: monospace;
                font-size: 12px;
                font-weight: bold;
                color: rgba(255,255,255,0.8);
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                transition: transform 0.06s ease, opacity 0.06s ease;
                touch-action: none;
            }
            .tc-menu-btn.pressed {
                transform: scale(0.9);
                opacity: 0.6;
            }
        `;
        document.head.appendChild(style);
    }

    _createDOM() {
        this.container = document.createElement('div');
        this.container.className = 'tc-container';
        this.container.style.display = 'none';

        // --- D-Pad ---
        const dpadSize = 130;
        const dpad = document.createElement('div');
        dpad.className = 'tc-dpad';
        Object.assign(dpad.style, {
            width: dpadSize + 'px',
            height: dpadSize + 'px',
            left: '20px',
            bottom: '30px',
            background: 'radial-gradient(circle, rgba(60,60,80,0.55) 0%, rgba(40,40,60,0.4) 70%, rgba(30,30,50,0.25) 100%)',
            border: '2px solid rgba(255,255,255,0.12)',
        });

        // Center dot
        const center = document.createElement('div');
        center.className = 'tc-dpad-center';
        dpad.appendChild(center);

        // Arrow indicators
        for (const dir of ['up', 'down', 'left', 'right']) {
            const arrow = document.createElement('div');
            arrow.className = `tc-dpad-arrow ${dir}`;
            dpad.appendChild(arrow);
        }

        this._setupDpad(dpad, dpadSize);
        this.container.appendChild(dpad);
        this.dpadEl = dpad;

        // --- A Button ---
        const btnSize = 58;
        const aBtn = document.createElement('div');
        aBtn.className = 'tc-btn';
        aBtn.setAttribute('role', 'button');
        aBtn.setAttribute('aria-label', 'Action button');
        Object.assign(aBtn.style, {
            width: btnSize + 'px',
            height: btnSize + 'px',
            right: '30px',
            bottom: '80px',
            background: 'radial-gradient(circle, rgba(76,175,80,0.65) 0%, rgba(56,142,60,0.5) 100%)',
            border: '2px solid rgba(76,175,80,0.5)',
            fontSize: '20px',
        });
        aBtn.textContent = 'A';
        this._setupButton(aBtn, () => this.input.onAction());
        this.container.appendChild(aBtn);

        // --- B Button ---
        const bBtn = document.createElement('div');
        bBtn.className = 'tc-btn';
        bBtn.setAttribute('role', 'button');
        bBtn.setAttribute('aria-label', 'Cancel button');
        Object.assign(bBtn.style, {
            width: btnSize + 'px',
            height: btnSize + 'px',
            right: (30 + btnSize + 16) + 'px',
            bottom: '36px',
            background: 'radial-gradient(circle, rgba(244,67,54,0.65) 0%, rgba(211,47,47,0.5) 100%)',
            border: '2px solid rgba(244,67,54,0.5)',
            fontSize: '20px',
        });
        bBtn.textContent = 'B';
        this._setupButton(bBtn, () => this.input.onCancel());
        this.container.appendChild(bBtn);

        // --- Menu Button ---
        const menuBtn = document.createElement('div');
        menuBtn.className = 'tc-menu-btn';
        menuBtn.setAttribute('role', 'button');
        menuBtn.setAttribute('aria-label', 'Menu button');
        Object.assign(menuBtn.style, {
            width: '60px',
            height: '30px',
            right: '12px',
            top: '12px',
            background: 'rgba(50,50,70,0.6)',
            border: '1px solid rgba(255,255,255,0.2)',
        });
        menuBtn.textContent = 'MENU';
        this._setupButton(menuBtn, () => this.input.onMenu());
        this.container.appendChild(menuBtn);

        document.body.appendChild(this.container);
    }

    _setupDpad(el, size) {
        const half = size / 2;
        const deadZone = 12;
        let activeTouchId = null;

        const calcDirection = (touch) => {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + half;
            const cy = rect.top + half;
            const dx = touch.clientX - cx;
            const dy = touch.clientY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < deadZone) {
                this.input.onDpad(0, 0);
                return;
            }

            const angle = Math.atan2(dy, dx);
            // 8-way direction from angle
            // Sector size = PI/4 (45 degrees)
            let x = 0, y = 0;

            // Right: -22.5 to 22.5 deg
            // Down-Right: 22.5 to 67.5
            // Down: 67.5 to 112.5
            // Down-Left: 112.5 to 157.5
            // Left: 157.5 to 180 or -180 to -157.5
            // Up-Left: -157.5 to -112.5
            // Up: -112.5 to -67.5
            // Up-Right: -67.5 to -22.5

            const deg = angle * 180 / Math.PI;

            if (deg >= -22.5 && deg < 22.5) { x = 1; y = 0; }
            else if (deg >= 22.5 && deg < 67.5) { x = 1; y = 1; }
            else if (deg >= 67.5 && deg < 112.5) { x = 0; y = 1; }
            else if (deg >= 112.5 && deg < 157.5) { x = -1; y = 1; }
            else if (deg >= 157.5 || deg < -157.5) { x = -1; y = 0; }
            else if (deg >= -157.5 && deg < -112.5) { x = -1; y = -1; }
            else if (deg >= -112.5 && deg < -67.5) { x = 0; y = -1; }
            else if (deg >= -67.5 && deg < -22.5) { x = 1; y = -1; }

            this.input.onDpad(x, y);
        };

        el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (activeTouchId === null) {
                activeTouchId = e.changedTouches[0].identifier;
                calcDirection(e.changedTouches[0]);
            }
        }, { passive: false });

        el.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === activeTouchId) {
                    calcDirection(e.changedTouches[i]);
                    break;
                }
            }
        }, { passive: false });

        const endDpad = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === activeTouchId) {
                    activeTouchId = null;
                    this.input.onDpad(0, 0);
                    break;
                }
            }
        };

        el.addEventListener('touchend', endDpad, { passive: false });
        el.addEventListener('touchcancel', endDpad, { passive: false });
    }

    _setupButton(el, callback) {
        el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            el.classList.add('pressed');
            callback();
        }, { passive: false });

        el.addEventListener('touchend', (e) => {
            e.preventDefault();
            el.classList.remove('pressed');
        }, { passive: false });

        el.addEventListener('touchcancel', (e) => {
            el.classList.remove('pressed');
        }, { passive: false });
    }

    show() {
        this.container.style.display = 'block';
        this.visible = true;
    }

    hide() {
        this.container.style.display = 'none';
        this.visible = false;
        this.input.onDpad(0, 0);
    }
}
