import { Canvas } from './Canvas.js';
import { Input } from './Input.js';
import { SaveManager } from './SaveManager.js';

export class Game {
    constructor() {
        this.canvas = new Canvas();
        this.input = new Input(this.canvas);
        this.save = new SaveManager();
        this.scenes = [];
        this.transitioning = false;
        this.transitionAlpha = 0;
        this.transitionTarget = null;
        this.transitionCallback = null;
        this.lastTime = 0;
        this.running = false;
        this.globalState = {
            playerName: 'Scout',
            gold: 1000,
            badges: [],
            playTime: 0,
            questStates: {},
            cryptidexSeen: new Set(),
            cryptidexCaught: new Set(),
            flags: {},
        };
    }

    get currentScene() {
        return this.scenes[this.scenes.length - 1] || null;
    }

    pushScene(scene) {
        scene.game = this;
        scene.canvas = this.canvas;
        scene.input = this.input;
        this.scenes.push(scene);
        scene.enter();
    }

    popScene() {
        const old = this.scenes.pop();
        if (old) old.exit();
        if (this.currentScene) this.currentScene.resume();
    }

    swapScene(scene) {
        const old = this.scenes.pop();
        if (old) old.exit();
        scene.game = this;
        scene.canvas = this.canvas;
        scene.input = this.input;
        this.scenes.push(scene);
        scene.enter();
    }

    transitionTo(scene, duration = 300) {
        if (this.transitioning) return;
        this.transitioning = true;
        this.transitionTarget = scene;
        this.transitionAlpha = 0;
        this.transitionPhase = 'out'; // fade out, then swap, then fade in
        this.transitionDuration = duration;
        this.transitionTimer = 0;
    }

    updateTransition(dt) {
        if (!this.transitioning) return;
        this.transitionTimer += dt;
        const half = this.transitionDuration / 2;

        if (this.transitionPhase === 'out') {
            this.transitionAlpha = Math.min(1, this.transitionTimer / half);
            if (this.transitionTimer >= half) {
                this.swapScene(this.transitionTarget);
                this.transitionPhase = 'in';
                this.transitionTimer = 0;
            }
        } else {
            this.transitionAlpha = 1 - Math.min(1, this.transitionTimer / half);
            if (this.transitionTimer >= half) {
                this.transitioning = false;
                this.transitionAlpha = 0;
            }
        }
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    loop(timestamp) {
        if (!this.running) return;
        const dt = Math.min(timestamp - this.lastTime, 50); // cap at 50ms
        this.lastTime = timestamp;
        this.globalState.playTime += dt;

        this.input.update();
        this.update(dt);
        this.render();
        this.input.postUpdate();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.updateTransition(dt);
        this.canvas.updateShake(dt);
        if (this.currentScene && !this.transitioning) {
            this.currentScene.update(dt);
        }
    }

    render() {
        this.canvas.clear();
        // Render all visible scenes (bottom to top)
        for (const scene of this.scenes) {
            scene.render(this.canvas);
        }
        // Transition overlay
        if (this.transitioning && this.transitionAlpha > 0) {
            this.canvas.setAlpha(this.transitionAlpha);
            this.canvas.fill('#000');
            this.canvas.resetAlpha();
        }
    }
}
