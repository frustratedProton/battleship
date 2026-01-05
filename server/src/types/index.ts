export interface ShipConfig {
    id: number;
    name: string;
    size: number;
}


export const SHIP_DEFINITIONS: ShipConfig[] = [
	{ id: 1, name: 'Carrier', size: 5 },
	{ id: 2, name: 'Battleship', size: 4 },
	{ id: 3, name: 'Cruiser', size: 3 },
	{ id: 4, name: 'Submarine', size: 3 },
	{ id: 5, name: 'Destroyer', size: 2 },
];


export interface Position {
    x: number;
    y: number;
}


export type CellState = 'empty' | 'ship' | 'hit' | 'miss';


export interface Ship extends ShipConfig {
    positions: Position[];
    placed: boolean;
    sunk: boolean;
}

export interface ShipPlacement {
    id: number;
    positions: Position[];
}

export interface FireResult {
	x: number;
	y: number;
	hit: boolean;
	sunk: boolean;
	sunkShip?: {
		id: number;
		name: string;
		positions: Position[];
	};
	gameOver: boolean;
	winner?: string;
}

export type GamePhase = 
  | 'waiting'      // Waiting for opponent
  | 'placement'    // Both placing ships
  | 'ready'        // This player ready, waiting for opponent
  | 'attack'       // Game in progress (renamed from 'playing')
  | 'won'          // This player won
  | 'lost';        // This player lost


export type Turn = 'player' | 'opponent';

export interface GameState {
	gameId: string;
	phase: GamePhase;
	isHost: boolean;
	opponentConnected: boolean;
	opponentReady: boolean;
	currentTurn: Turn | null;
	winner: 'player' | 'opponent' | null;
}

export const BOARD_SIZE = 10;