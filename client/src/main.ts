// Client

import { io } from "socket.io-client";

const socket = io('localhost:3000');
const game_screen: HTMLElement = document.getElementById('gameScreen') as HTMLElement;
const BG_COLOUR: string = '#231f20';
const SPEED_FACTOR: number = 5;
const TILE_SIZE: number = 10;

let canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
let max_x: number = canvas.width = 600;
let max_y: number = canvas.height = 600;
let ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;

ctx.fillStyle = BG_COLOUR;
ctx.fillRect(0, 0, max_x, max_y);

// Disable arrow key defaults on the browser
var arrow_keys_handler = function (e: KeyboardEvent) {
    switch (e.code) {
        case "ArrowUp": case "ArrowDown": case "ArrowLeft": case "ArrowRight":
        case "Space": e.preventDefault(); break;
        default: break; // do not block other keys
    }
};
window.addEventListener("keydown", arrow_keys_handler, false);

interface GameState {
    grid_size: number;
    players: Array<GamePlayer>;
    is_finish: boolean;
}

interface GamePlayer {
    x: number;
    y: number;
    dx: number;
    dy: number;
    area: Array<[number, number]>;
    color: string;
    is_alive: boolean;
}

let grid: GameState = {
    grid_size: 600, players: [
        { x: 0, y: 0, dx: 0, dy: 0, area: [[0, 0]], color: 'red', is_alive: false }
    ], is_finish: false
};

function RenderGame(ctx: CanvasRenderingContext2D, grid: GameState): void {
    ctx.strokeStyle = 'grey';
    let size: number = grid.grid_size;
    for (let r = 0; r < size; r += TILE_SIZE) {
        for (let c = 0; c < size; c += TILE_SIZE) {
            ctx.strokeRect(r, c, TILE_SIZE, TILE_SIZE);
        }
    }

    for (let p of grid.players) {
        ctx.fillStyle = p.color;
        for(let [x, y] of p.area) {
            ctx.fillRect(x, y, TILE_SIZE-1, TILE_SIZE-1);
        } 
    }
}

function UpdateGame(game: GameState): void {
    for (let p of grid.players) {
        p.x = (p.x + p.dx * TILE_SIZE) % game.grid_size;
        p.y = (p.y + p.dy * TILE_SIZE) % game.grid_size;
        if (p.x < 0) p.x += game.grid_size;
        if (p.y < 0) p.y += game.grid_size;
        p.area.push([p.x, p.y]);
    }
}
canvas.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp') {
        grid.players[0].dx = 0;
        grid.players[0].dy = -1;
    } else if (e.code === 'ArrowLeft') {
        grid.players[0].dx = -1;
        grid.players[0].dy = 0;
    } else if (e.code === 'ArrowRight') {
        grid.players[0].dx = 1;
        grid.players[0].dy = 0;
    } else if (e.code === 'ArrowDown') {
        grid.players[0].dx = 0;
        grid.players[0].dy = 1;
    }
});
canvas.focus();
ctx.fillStyle = 'red';
function loop() {
    UpdateGame(grid);
    RenderGame(ctx, grid);
    requestAnimationFrame(loop);
    console.log("Hello");
}

loop();
