import type { ShipConfig } from '../ships.config';

export type CellState = 'empty' | 'ship' | 'hit' | 'miss';

export interface Position {
	x: number;
	y: number;
}

export interface Ship extends ShipConfig {
	positions: Position[];
	placed: boolean;
	sunk: boolean;
}

export interface Board {
	cells: CellState[][];
}

export interface ShipPlacement {
	id: number;
	positions: Position[];
}

export type GamePhase =
	| 'waiting' // Waiting for opponent
	| 'placement' // Both placing ships
	| 'ready' // This player ready, waiting for opponent
	| 'attack' // Game in progress
	| 'won' // This player won
	| 'lost'; // This player lost

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

// Socket response types
export interface CreateGameResponse {
	success: boolean;
	gameId?: string;
	state?: GameState;
	message?: string;
}

export interface JoinGameResponse {
	success: boolean;
	gameId?: string;
	state?: GameState;
	message?: string;
}

export interface PlaceShipsResponse {
	success: boolean;
	state?: GameState;
	message?: string;
}

export interface FireResponse {
	success: boolean;
	result?: FireResult;
	message?: string;
}
