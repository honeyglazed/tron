import { createServer } from "http";
import { Server, Socket } from "socket.io";

// Map of client to the room
let rooms: Map<string, string> = new Map();
// Map of room to the game state
let states: Map<string, GameState> = new Map();

interface GameState {
    grid_size: number;
    grid: Array<Array<number>>;
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
    player: number;
}

const GRID_SIZE = 60 // 60 x 60 board
const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: true,
        methods: ["GET", "POST"]
    }
});

function updateGameState(game: GameState): void {
    for (let p of game.players) {
        p.x = (p.x + p.dx) % game.grid_size;
        p.y = (p.y + p.dy) % game.grid_size;
        if (p.x < 0) p.x += game.grid_size;
        if (p.y < 0) p.y += game.grid_size;
        if (game.grid[p.x][p.y] != 0) {
            game.is_finish = true;
            p.is_alive = false;
        } else {
            game.grid[p.x][p.y] = p.player;
        }
    }
}

function handleKeyPress(client_id: string, player: number, key: number): void {
    // 0 - up
    // 1 - left
    // 2 - right
    // 3 - down
    if (!rooms.has(client_id)) {
        console.log('Error: ' + client_id + ' does not have a room!')
        return;
    }
    const room: string = rooms.get(client_id) as string;
    let state: GameState = states.get(room) as GameState;
    if (key == 0) {
        state.players[player-1].dx = 0;
        state.players[player-1].dy = -1;
    } else if (key == 1) {
        state.players[player-1].dx = -1;
        state.players[player-1].dy = 0;
    } else if (key == 2) {
        state.players[player-1].dx = 1;
        state.players[player-1].dy = 0;
    } else if (key == 3) {
        state.players[player-1].dx = 0;
        state.players[player-1].dy = 1;
    }
}

function emitGameState(room: string, state: GameState): void {
    io.sockets.in(room).emit('game-update', JSON.stringify(state, function(k, v) { if (k != 'grid') return v;}));
}

function emitGameOver(room: string, winner: string): void {
    io.sockets.in(room).emit('game-over', winner);
}

function emitGameRestart(room: string): void {
    io.sockets.in(room).emit('game-restart');
}

function initState(): GameState {
    let grid: Array<Array<number>> = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    return {
        grid_size: GRID_SIZE, grid: grid, players: [
            { x: 30, y: 30, dx: 1, dy: 0, area: [[59, 59]], color: 'blue', is_alive: true, player: 1},
            { x: 10, y: 10, dx: -1, dy: 0, area: [[0, 0]], color: 'red', is_alive: true, player: 2}
        ], is_finish: false
    };
}

function generateRoomCode(): string {
    const VALUES: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const CODE_LENGTH: number = 5;
    let code: Array<string> = [];
    while (code.length != CODE_LENGTH) {
        code.push(VALUES.charAt(Math.floor(Math.random() * VALUES.length)));
    }
    return code.join('');
}

function startGameForRoom(room: string): void{
    console.log('Starting game for room=', room);
    states.set(room, initState());
    let state: GameState = states.get(room)!;
    const REFRESH_RATE = setInterval(() => {
        updateGameState(state);
        if (!state.is_finish) {
            emitGameState(room, state);
        } else {
            const winner: string = state.players[0].is_alive ? 'P1' : 'P2';
            console.log('Player ' + winner + ' won!');
            emitGameOver(room, winner);
            clearInterval(REFRESH_RATE);
        }
    }, 100);
}

io.on("connection", (client: Socket) => {
    console.log('Connected to client=' + client.id);
    client.on('create-game', () => {
        if (rooms.has(client.id)) {
            console.log('Error: game already exists for client=', client.id);
            client.emit('error');
        }
        client.data.player = 1;
        let code: string = generateRoomCode();
        rooms.set(client.id, code);
        client.join(code);
        console.log('game created - room=', code);
        console.log('Total rooms is', rooms.size);
        client.emit('game-code', code);
    });
    client.on('join-game', (code) => {
        console.log('client sent game code', code);
        if (!io.sockets.adapter.rooms.has(code)) {
            console.log('Error: No game with code=', code);
            client.emit('error');
        } else {
            const num_players: number = io.sockets.adapter.rooms.get(code)!.size;
            console.log('Number of current players is', num_players);
            if (num_players == 0) {
                console.log('Error: Cannot join game with code=' + code + ' beause it has no players');
                client.emit('error');
            } else if (num_players > 1) {
                console.log('Error: Cannot join game with code=' + code + ' because it has too many players');
                client.emit('error');
            } else {
                rooms.set(client.id, code);
                client.join(code);
                client.data.player = num_players + 1;
                startGameForRoom(code);
            }
        }
    });
    client.on('key-press', (key) => {
        handleKeyPress(client.id, client.data.player, key);
    })
    client.on('restart-game', () => {
        if (!rooms.has(client.id)) {
            console.log('Error: Cannot restart game since no room exists');
        } else {
            const room_code: string = rooms.get(client.id) as string;
            emitGameRestart(room_code);
            startGameForRoom(room_code);
        }
    })
});
httpServer.listen(3000, '127.0.0.1', () => { console.log('server started') });
