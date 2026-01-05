import { create } from 'zustand';
import type { Board, Ship } from '../types/game';
import { SHIP_DEFINITIONS } from '../ships.config';

interface GameState {
	playerBoard: Board;
	enemyBoard: Board;
	playerShips: Ship[];
	enemyShips: Ship[];
	phase: 'placement' | 'attack' | 'won' | 'lost';
	turn: 'player' | 'enemy';
	enemyHits: { x: number; y: number }[];
	enemyTargets: { x: number; y: number }[];
	lastSunkShip: string | null;
	placeShip: (id: number, x: number, y: number, horizontal: boolean) => void;
	attack: (x: number, y: number) => void;
	enemyAttack: () => void;
	placeEnemyShips: () => void;
	startBattle: () => void;
	randomizePlayerShips: () => void;
	clearSunkMessage: () => void;
	reset: () => void;
}

const makeBoard = (): Board => ({
	cells: Array.from({ length: 10 }, () => Array(10).fill('empty')),
});

const makeShips = (): Ship[] =>
	SHIP_DEFINITIONS.map((def) => ({
		...def,
		positions: [],
		placed: false,
		sunk: false,
	}));

const checkAndMarkSunkShips = (
	ships: Ship[],
	board: Board
): { ships: Ship[]; newlySunk: Ship | null } => {
	let newlySunk: Ship | null = null;

	const updatedShips = ships.map((ship) => {
		if (ship.sunk) return ship;

		const isSunk =
			ship.positions.length > 0 &&
			ship.positions.every((p) => board.cells[p.y][p.x] === 'hit');

		if (isSunk) {
			const sunkShip = { ...ship, sunk: true };
			if (!newlySunk) {
				newlySunk = sunkShip;
			}
			return sunkShip;
		}

		return ship;
	});

	return { ships: updatedShips, newlySunk };
};

const DIRECTIONS = [
	{ x: 1, y: 0 },
	{ x: -1, y: 0 },
	{ x: 0, y: 1 },
	{ x: 0, y: -1 },
];

export const useGameStore = create<GameState>((set) => ({
	playerBoard: makeBoard(),
	enemyBoard: makeBoard(),
	playerShips: makeShips(),
	enemyShips: [],
	phase: 'placement',
	turn: 'player',
	enemyHits: [],
	enemyTargets: [],
	lastSunkShip: null,

	placeShip: (id, x, y, horizontal) =>
		set((state) => {
			const board = structuredClone(state.playerBoard);
			const ship = state.playerShips.find((s) => s.id === id);
			if (!ship || ship.placed) return state;

			const positions = Array.from({ length: ship.size }).map((_, i) => ({
				x: horizontal ? x + i : x,
				y: horizontal ? y : y + i,
			}));

			const invalid = positions.some(
				(p) =>
					p.x >= 10 || p.y >= 10 || board.cells[p.y][p.x] === 'ship'
			);
			if (invalid) return state;

			positions.forEach((p) => (board.cells[p.y][p.x] = 'ship'));
			ship.positions = positions;
			ship.placed = true;

			return {
				playerBoard: board,
				playerShips: [...state.playerShips],
			};
		}),

	attack: (x, y) =>
		set((state) => {
			if (state.phase !== 'attack' || state.turn !== 'player')
				return state;

			const board = structuredClone(state.enemyBoard);
			const cell = board.cells[y][x];

			if (cell === 'hit' || cell === 'miss') return state;

			board.cells[y][x] = cell === 'ship' ? 'hit' : 'miss';

			const { ships: updatedEnemyShips, newlySunk } =
				checkAndMarkSunkShips(state.enemyShips, board);

			const allSunk = updatedEnemyShips.every((ship) => ship.sunk);

			if (allSunk) {
				return {
					enemyBoard: board,
					enemyShips: updatedEnemyShips,
					phase: 'won',
					lastSunkShip: newlySunk
						? `You sunk their ${newlySunk.name}!`
						: null,
				};
			}

			setTimeout(() => {
				useGameStore.getState().enemyAttack();
			}, 400);

			return {
				enemyBoard: board,
				enemyShips: updatedEnemyShips,
				turn: 'enemy',
				lastSunkShip: newlySunk
					? `You sunk their ${newlySunk.name}!`
					: null,
			};
		}),

	enemyAttack: () =>
		set((state) => {
			if (state.phase !== 'attack' || state.turn !== 'enemy')
				return state;

			const board = structuredClone(state.playerBoard);
			const enemyHits = [...state.enemyHits];
			const enemyTargets = [...state.enemyTargets];

			let x = 0;
			let y = 0;

			if (enemyTargets.length > 0) {
				const t = enemyTargets.shift()!;
				x = t.x;
				y = t.y;
			} else {
				while (true) {
					x = Math.floor(Math.random() * 10);
					y = Math.floor(Math.random() * 10);
					const c = board.cells[y][x];
					if (c !== 'hit' && c !== 'miss') break;
				}
			}

			const cell = board.cells[y][x];

			if (cell === 'empty') board.cells[y][x] = 'miss';
			else if (cell === 'ship') {
				board.cells[y][x] = 'hit';
				enemyHits.push({ x, y });

				DIRECTIONS.forEach((d) => {
					const nx = x + d.x;
					const ny = y + d.y;

					if (
						nx >= 0 &&
						nx < 10 &&
						ny >= 0 &&
						ny < 10 &&
						board.cells[ny][nx] !== 'hit' &&
						board.cells[ny][nx] !== 'miss'
					) {
						enemyTargets.push({ x: nx, y: ny });
					}
				});
			}

			const { ships: updatedPlayerShips, newlySunk } =
				checkAndMarkSunkShips(state.playerShips, board);

			const allSunk = updatedPlayerShips.every((ship) => ship.sunk);

			if (allSunk) {
				return {
					playerBoard: board,
					playerShips: updatedPlayerShips,
					phase: 'lost',
					enemyHits,
					enemyTargets,
					lastSunkShip: newlySunk
						? `Enemy sunk your ${newlySunk.name}!`
						: null,
				};
			}

			return {
				playerBoard: board,
				playerShips: updatedPlayerShips,
				turn: 'player',
				enemyHits,
				enemyTargets,
				lastSunkShip: newlySunk
					? `Enemy sunk your ${newlySunk.name}!`
					: null,
			};
		}),

	placeEnemyShips: () =>
		set((state) => {
			const board = structuredClone(state.enemyBoard);
			const ships = makeShips();

			const tryPlace = (ship: Ship) => {
				while (true) {
					const horizontal = Math.random() < 0.5;
					const x = Math.floor(Math.random() * 10);
					const y = Math.floor(Math.random() * 10);

					const positions = Array.from({ length: ship.size }).map(
						(_, i) => ({
							x: horizontal ? x + i : x,
							y: horizontal ? y : y + i,
						})
					);

					if (
						positions.some(
							(p) =>
								p.x >= 10 ||
								p.y >= 10 ||
								board.cells[p.y][p.x] === 'ship'
						)
					)
						continue;

					positions.forEach((p) => (board.cells[p.y][p.x] = 'ship'));
					ship.positions = positions;
					ship.placed = true;
					return;
				}
			};

			ships.forEach(tryPlace);

			return {
				enemyBoard: board,
				enemyShips: ships,
			};
		}),

	startBattle: () =>
		set((state) => {
			const allPlaced = state.playerShips.every((s) => s.placed);
			if (!allPlaced) return state;

			useGameStore.getState().placeEnemyShips();

			return {
				phase: 'attack',
				turn: 'player',
			};
		}),

	clearSunkMessage: () => set({ lastSunkShip: null }),

	reset: () =>
		set(() => ({
			playerBoard: makeBoard(),
			enemyBoard: makeBoard(),
			playerShips: makeShips(),
			enemyShips: [],
			phase: 'placement',
			turn: 'player',
			enemyHits: [],
			enemyTargets: [],
			lastSunkShip: null,
		})),

	randomizePlayerShips: () =>
		set(() => {
			const board = makeBoard();
			const ships = makeShips();

			const tryPlace = (ship: Ship) => {
				while (true) {
					const horizontal = Math.random() < 0.5;
					const x = Math.floor(Math.random() * 10);
					const y = Math.floor(Math.random() * 10);

					const positions = Array.from({ length: ship.size }).map(
						(_, i) => ({
							x: horizontal ? x + i : x,
							y: horizontal ? y : y + i,
						})
					);

					if (
						positions.some(
							(p) =>
								p.x >= 10 ||
								p.y >= 10 ||
								board.cells[p.y][p.x] === 'ship'
						)
					)
						continue;

					positions.forEach((p) => (board.cells[p.y][p.x] = 'ship'));
					ship.positions = positions;
					ship.placed = true;
					return;
				}
			};

			ships.forEach(tryPlace);

			return {
				playerBoard: board,
				playerShips: ships,
			};
		}),
}));
