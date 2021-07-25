import { io } from "socket.io-client";

const socket = io('https://tron-backend-763watxteq-uc.a.run.app');
const game_screen: HTMLElement = document.getElementById('gameScreen') as HTMLElement;
const join_game_btn: HTMLElement = document.getElementById('joinGame') as HTMLElement;
const create_game_btn: HTMLElement = document.getElementById('createGame') as HTMLElement;
const game_alert: HTMLElement = document.getElementById('gameAlert') as HTMLElement;
const reset_game_btn: HTMLElement = document.getElementById('resetGame') as HTMLElement;
const BG_COLOUR: string = '#231f20';
const TILE_SIZE: number = 10;
const GRID_SIZE: number = 600;

let canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
let max_x: number = canvas.width = GRID_SIZE;
let max_y: number = canvas.height = GRID_SIZE;
let ctx: CanvasRenderingContext2D = canvas.getContext("2d") as CanvasRenderingContext2D;
let is_init: boolean = false;
let game_active: boolean = false;
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

join_game_btn.addEventListener('click', (e) => {
    handleJoinGame();
})

create_game_btn.addEventListener('click', (e) => {
    handleCreateGame();
})

reset_game_btn.addEventListener('click', (e) => {
    socket.emit('restart-game');
})

console.log("Connected=", socket.active);

// Socket events
socket.on('game-update', (data) => {
    handleGameUpdate(JSON.parse(data));
});

socket.on('game-over', (data) => {
    handleGameOver(data);
});

socket.on('game-restart', () => {
    handleResetGame();
});

interface GameState {
    grid_size: number;
    players: Array<GamePlayer>;
    is_finish: boolean;
    player: number;
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

/* Event Handlers */
function handleGameUpdate(update: GameState): void {
    requestAnimationFrame(() => renderGame(ctx, update));
}

function handleCreateGame(): void {
    create_game_btn.removeEventListener('click', handleCreateGame);
    socket.emit('create-game');
    socket.on('game-code', (code) => {
        console.log('Created room with code', code);
        resetGame(ctx);
        game_alert.classList.remove('invisible');
        game_alert.style.display = 'flex';
        game_alert.textContent = 'Created game with code: ' + code;
    })
}

function handleJoinGame(): void {
    let game_code_input: HTMLInputElement = document.getElementById('gameCode') as HTMLInputElement;
    console.log('Joining game with', game_code_input.value);
    socket.emit('join-game', game_code_input.value);
}

function handleGameOver(winner: string): void {
    game_alert.classList.remove('alert-success');
    game_alert.classList.add('alert-info');
    game_alert.classList.remove('invisible');
    game_alert.textContent = 'Player ' + winner + ' has won!';
    console.log('The winner is ', winner);
    reset_game_btn.classList.remove('invisible');
}

function handleResetGame(): void {
    game_alert.classList.add('invisible');
    reset_game_btn.classList.add('invisible');
    resetGame(ctx);
    is_init = false;
}

function renderGame(ctx: CanvasRenderingContext2D, game: GameState): void {
    if (!is_init) {
        ctx.strokeStyle = 'grey';
        let size: number = game.grid_size;
        for (let r = 0; r < size; ++r) {
            for (let c = 0; c < size; ++c) {
                ctx.strokeRect(r*TILE_SIZE, c*TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
        is_init = true;
    }
   for (let p of game.players) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x*TILE_SIZE, p.y*TILE_SIZE, TILE_SIZE-2, TILE_SIZE-2);
   }
}

function resetGame(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
    ctx.fillStyle = BG_COLOUR;
    ctx.fillRect(0, 0, max_x, max_y)
}

canvas.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp') {
        socket.emit('key-press', 0);
    } else if (e.code === 'ArrowLeft') {
        socket.emit('key-press', 1);
    } else if (e.code === 'ArrowRight') {
        socket.emit('key-press', 2);
    } else if (e.code === 'ArrowDown') {
        socket.emit('key-press', 3);
    }
});
canvas.focus();
