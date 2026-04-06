export class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.direction = { x: 0, y: 0 };
        this.action = false;
        this.cancel = false;
        this.menu = false;
        this.actionJustPressed = false;
        this.cancelJustPressed = false;
        this.menuJustPressed = false;
        this.touches = {};
        this.dpadState = { x: 0, y: 0 };
        this.prevAction = false;
        this.prevCancel = false;
        this.prevMenu = false;

        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Touch - handled by TouchControls UI component
        this.onDpad = (x, y) => { this.dpadState.x = x; this.dpadState.y = y; };
        this.onAction = () => { this.action = true; };
        this.onCancel = () => { this.cancel = true; };
        this.onMenu = () => { this.menu = true; };
    }

    update() {
        // Keyboard direction
        let kx = 0, ky = 0;
        if (this.keys['ArrowLeft'] || this.keys['a']) kx = -1;
        if (this.keys['ArrowRight'] || this.keys['d']) kx = 1;
        if (this.keys['ArrowUp'] || this.keys['w']) ky = -1;
        if (this.keys['ArrowDown'] || this.keys['s']) ky = 1;

        // Combine keyboard and dpad
        this.direction.x = kx || this.dpadState.x;
        this.direction.y = ky || this.dpadState.y;

        // Keyboard buttons
        if (this.keys['z'] || this.keys['Enter'] || this.keys[' ']) this.action = true;
        if (this.keys['x'] || this.keys['Escape'] || this.keys['Backspace']) this.cancel = true;
        if (this.keys['m'] || this.keys['Tab']) this.menu = true;

        // Just pressed detection
        this.actionJustPressed = this.action && !this.prevAction;
        this.cancelJustPressed = this.cancel && !this.prevCancel;
        this.menuJustPressed = this.menu && !this.prevMenu;

        this.prevAction = this.action;
        this.prevCancel = this.cancel;
        this.prevMenu = this.menu;
    }

    postUpdate() {
        this.action = false;
        this.cancel = false;
        this.menu = false;
        // Keep keys held - only cleared on keyup
        // Keep dpad - only cleared by TouchControls
    }

    isDown(key) {
        return !!this.keys[key];
    }

    reset() {
        this.keys = {};
        this.direction = { x: 0, y: 0 };
        this.action = false;
        this.cancel = false;
        this.menu = false;
        this.dpadState = { x: 0, y: 0 };
    }
}
