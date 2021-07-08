const game_screen : HTMLElement = document.getElementById('gameScreen') as HTMLElement;
const BG_COLOUR : string = '#231f20';
const SPEED_FACTOR : number = 5;

let canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
let max_x: number = canvas.width = 600;
let max_y: number = canvas.height = 600;
let ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;


ctx.fillStyle = BG_COLOUR;
ctx.fillRect(0, 0, max_x, max_y);

var arrow_keys_handler = function(e : KeyboardEvent) {
    switch(e.code){
        case "ArrowUp": case "ArrowDown": case "ArrowLeft": case "ArrowRight": 
            case "Space": e.preventDefault(); break;
        default: break; // do not block other keys
    }
};
window.addEventListener("keydown", arrow_keys_handler, false);

class Player {
    private x: number;
    private y: number;
    private dx: number;
    private dy: number;
    private canvas: HTMLCanvasElement;

    constructor(x: number, y: number, canvas: HTMLCanvasElement) {
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;
        this.canvas = canvas;
        this.canvas.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowUp') {
                this.dx = 0;
                this.dy = -1;
            } else if (e.code === 'ArrowLeft') {
                this.dx = -1;
                this.dy = 0;
            } else if (e.code === 'ArrowRight') {
                this.dx = 1;
                this.dy = 0;
            } else if (e.code === 'ArrowDown') {
                this.dx = 0;
                this.dy = 1;
            }
        });
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    move() {
        this.x += this.dx * SPEED_FACTOR;
        this.y += this.dy * SPEED_FACTOR;
    }
}

let p1 = new Player(1, 1, canvas);
canvas.focus();
function loop() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(p1.getX(), p1.getY(), 5, 5);
    p1.move();
    requestAnimationFrame(loop);
}

loop();
