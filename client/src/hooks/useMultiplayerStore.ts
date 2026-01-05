import { create } from 'zustand';
import type {
	Board,
	Ship,
	GameState,
	FireResult,
	CreateGameResponse,
	JoinGameResponse,
	PlaceShipsResponse,
} from '../types/game';
import { SHIP_DEFINITIONS } from '../ships.config';
import socketService, { EVENTS } from '../services/socket';

interface MultiplayerState {
	// Connection
	connected: boolean;
	connecting: boolean;
	gameId: string | null;
	error: string | null;

	// Game state from server
	gameState: GameState | null;

	// Local boards
	playerBoard: Board;
	enemyBoard: Board;
	playerShips: Ship[];

	// UI state
	lastSunkShip: string | null;
	rematchRequested: boolean;

	// Actions
	connect: () => void;
	disconnect: () => void;
	createGame: () => Promise<string | null>;
	joinGame: (gameId: string) => Promise<boolean>;
	placeShip: (
		id: number,
		x: number,
		y: number,
		horizontal: boolean
	) => boolean;
	removeShip: (id: number) => void;
	randomizeShips: () => void;
	clearPlacement: () => void;
	submitShips: () => Promise<boolean>;
	attack: (x: number, y: number) => void;
	requestRematch: () => void;
	clearSunkMessage: () => void;
	clearError: () => void;
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

let listenersInitialized = false;

function setupSocketListeners(
	set: (
		partial:
			| Partial<MultiplayerState>
			| ((state: MultiplayerState) => Partial<MultiplayerState>)
	) => void,
	get: () => MultiplayerState
): void {
	if (listenersInitialized) return;

	const socket = socketService.getSocket();
	if (!socket) return;

	listenersInitialized = true;

	socket.on('connect', () => {
		console.log('Connected to server:', socket.id);
		set({ connected: true, connecting: false, error: null });
	});

	socket.on('disconnect', (reason: string) => {
		console.log('Disconnected:', reason);
		set({ connected: false, connecting: false });

		if (reason === 'io server disconnect' || reason === 'transport close') {
			set({ error: 'Connection lost. Please reconnect.' });
		}
	});

	socket.on('connect_error', (error: Error) => {
		console.error('Connection error:', error.message);
		set({
			connected: false,
			connecting: false,
			error: 'Failed to connect to server',
		});
	});


	socket.on(EVENTS.ERROR, (data: { message: string }) => {
		set({ error: data.message });
	});

	socket.on(EVENTS.PLAYER_JOINED, (data: { state: GameState }) => {
		console.log('Opponent joined!', data.state);
		set({ gameState: data.state, error: null });
	});

	socket.on(EVENTS.OPPONENT_READY, (data: { state: GameState }) => {
		console.log('Opponent ready!', data.state);
		set({ gameState: data.state });
	});

	socket.on(EVENTS.GAME_START, (data: { state: GameState }) => {
		console.log('Game starting!', data.state);
		set({ gameState: data.state, error: null });
	});

	socket.on(EVENTS.FIRE_RESULT, (data: FireResult & { state: GameState }) => {
		const { enemyBoard } = get();
		const newBoard = structuredClone(enemyBoard);
		newBoard.cells[data.y][data.x] = data.hit ? 'hit' : 'miss';

		set({
			enemyBoard: newBoard,
			gameState: data.state,
			lastSunkShip:
				data.sunk && data.sunkShip
					? `You sunk their ${data.sunkShip.name}!`
					: null,
		});
	});

	socket.on(
		EVENTS.OPPONENT_FIRED,
		(data: {
			x: number;
			y: number;
			hit: boolean;
			sunk: boolean;
			sunkShip?: { id: number; name: string };
			state: GameState;
		}) => {
			const { playerBoard, playerShips } = get();
			const newBoard = structuredClone(playerBoard);
			newBoard.cells[data.y][data.x] = data.hit ? 'hit' : 'miss';

			let updatedShips = playerShips;
			if (data.sunk && data.sunkShip) {
				updatedShips = playerShips.map((ship) =>
					ship.id === data.sunkShip!.id
						? { ...ship, sunk: true }
						: ship
				);
			}

			set({
				playerBoard: newBoard,
				playerShips: updatedShips,
				gameState: data.state,
				lastSunkShip:
					data.sunk && data.sunkShip
						? `Enemy sunk your ${data.sunkShip.name}!`
						: null,
			});
		}
	);

	socket.on(EVENTS.GAME_OVER, (data: { state: GameState }) => {
		console.log('Game over!', data.state);
		set({ gameState: data.state });
	});

	socket.on(EVENTS.OPPONENT_DISCONNECTED, () => {
		set({ error: 'Opponent disconnected from the game' });
	});

	socket.on(EVENTS.OPPONENT_RECONNECTED, () => {
		set((state) => ({
			gameState: state.gameState
				? { ...state.gameState, opponentConnected: true }
				: null,
			error: null,
		}));
	});

	socket.on(EVENTS.REMATCH_REQUESTED, () => {
		set({ rematchRequested: true, error: 'Opponent wants a rematch!' });
	});

	socket.on(EVENTS.REMATCH_ACCEPTED, (data: { state: GameState }) => {
		set({
			gameState: data.state,
			playerBoard: makeBoard(),
			enemyBoard: makeBoard(),
			playerShips: makeShips(),
			lastSunkShip: null,
			rematchRequested: false,
			error: null,
		});
	});
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
	connected: false,
	connecting: false,
	gameId: null,
	error: null,
	gameState: null,
	playerBoard: makeBoard(),
	enemyBoard: makeBoard(),
	playerShips: makeShips(),
	lastSunkShip: null,
	rematchRequested: false,

	connect: () => {
		const { connected, connecting } = get();
		if (connected || connecting) return;

		set({ connecting: true, error: null });

		const socket = socketService.connect();
		setupSocketListeners(set, get);

		if (socket.connected) {
			set({ connected: true, connecting: false });
		}
	},

	disconnect: () => {
		socketService.disconnect();
		listenersInitialized = false;
		set({
			connected: false,
			connecting: false,
			gameId: null,
			gameState: null,
			playerBoard: makeBoard(),
			enemyBoard: makeBoard(),
			playerShips: makeShips(),
			error: null,
			lastSunkShip: null,
			rematchRequested: false,
		});
	},

	createGame: async () => {
		const { connected } = get();

		if (!connected) {
			set({ error: 'Not connected to server' });
			return null;
		}

		try {
			const response = await socketService.emit<CreateGameResponse>(
				EVENTS.CREATE_GAME
			);

			if (response.success && response.gameId && response.state) {
				set({
					gameId: response.gameId,
					gameState: response.state,
					error: null,
				});
				return response.gameId;
			}

			set({ error: response.message || 'Failed to create game' });
			return null;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Connection error';
			set({ error: message });
			return null;
		}
	},

	joinGame: async (gameId: string) => {
		const { connected } = get();

		if (!connected) {
			set({ error: 'Not connected to server' });
			return false;
		}

		const trimmedId = gameId.trim().toUpperCase();
		if (!trimmedId) {
			set({ error: 'Please enter a game code' });
			return false;
		}

		try {
			const response = await socketService.emit<JoinGameResponse>(
				EVENTS.JOIN_GAME,
				{ gameId: trimmedId }
			);

			if (response.success && response.state) {
				set({
					gameId: response.gameId || trimmedId,
					gameState: response.state,
					error: null,
				});
				return true;
			}

			set({ error: response.message || 'Failed to join game' });
			return false;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Connection error';
			set({ error: message });
			return false;
		}
	},

	placeShip: (id, x, y, horizontal) => {
		const { playerBoard, playerShips, gameState } = get();

		if (
			gameState &&
			gameState.phase !== 'placement' &&
			gameState.phase !== 'ready'
		) {
			return false;
		}

		const ship = playerShips.find((s) => s.id === id);
		if (!ship) return false;

		const newBoard = structuredClone(playerBoard);

		if (ship.placed) {
			ship.positions.forEach((p) => {
				newBoard.cells[p.y][p.x] = 'empty';
			});
		}

		const positions = Array.from({ length: ship.size }).map((_, i) => ({
			x: horizontal ? x + i : x,
			y: horizontal ? y : y + i,
		}));

		const invalid = positions.some(
			(p) =>
				p.x < 0 ||
				p.x >= 10 ||
				p.y < 0 ||
				p.y >= 10 ||
				newBoard.cells[p.y][p.x] === 'ship'
		);

		if (invalid) return false;

		positions.forEach((p) => (newBoard.cells[p.y][p.x] = 'ship'));

		const updatedShips = playerShips.map((s) =>
			s.id === id ? { ...s, positions, placed: true } : s
		);

		set({ playerBoard: newBoard, playerShips: updatedShips });
		return true;
	},

	removeShip: (id) => {
		const { playerBoard, playerShips, gameState } = get();

		if (gameState?.phase !== 'placement') return;

		const ship = playerShips.find((s) => s.id === id);
		if (!ship || !ship.placed) return;

		const newBoard = structuredClone(playerBoard);
		ship.positions.forEach((p) => {
			newBoard.cells[p.y][p.x] = 'empty';
		});

		const updatedShips = playerShips.map((s) =>
			s.id === id ? { ...s, positions: [], placed: false } : s
		);

		set({ playerBoard: newBoard, playerShips: updatedShips });
	},

	randomizeShips: () => {
		const { gameState } = get();
		if (gameState && gameState.phase !== 'placement') return;

		const board = makeBoard();
		const ships = makeShips();

		for (const ship of ships) {
			let placed = false;
			let attempts = 0;

			while (!placed && attempts < 100) {
				attempts++;
				const horizontal = Math.random() < 0.5;
				const maxX = horizontal ? 10 - ship.size : 9;
				const maxY = horizontal ? 9 : 10 - ship.size;
				const x = Math.floor(Math.random() * (maxX + 1));
				const y = Math.floor(Math.random() * (maxY + 1));

				const positions = Array.from({ length: ship.size }).map(
					(_, i) => ({
						x: horizontal ? x + i : x,
						y: horizontal ? y : y + i,
					})
				);

				const valid = positions.every(
					(p) =>
						p.x < 10 &&
						p.y < 10 &&
						board.cells[p.y][p.x] === 'empty'
				);

				if (valid) {
					positions.forEach((p) => (board.cells[p.y][p.x] = 'ship'));
					ship.positions = positions;
					ship.placed = true;
					placed = true;
				}
			}
		}

		set({ playerBoard: board, playerShips: ships });
	},

	clearPlacement: () => {
		const { gameState } = get();
		if (gameState?.phase !== 'placement') return;

		set({
			playerBoard: makeBoard(),
			playerShips: makeShips(),
		});
	},

	submitShips: async () => {
		const { playerShips, connected, gameState } = get();

		if (!connected) {
			set({ error: 'Not connected to server' });
			return false;
		}

		if (gameState?.phase !== 'placement') {
			set({ error: 'Cannot place ships now' });
			return false;
		}

		const unplacedShips = playerShips.filter((ship) => !ship.placed);
		if (unplacedShips.length > 0) {
			set({
				error: `Place all ships first. Missing: ${unplacedShips
					.map((s) => s.name)
					.join(', ')}`,
			});
			return false;
		}

		const placements = playerShips.map((ship) => ({
			id: ship.id,
			positions: ship.positions,
		}));

		try {
			const response = await socketService.emit<PlaceShipsResponse>(
				EVENTS.PLACE_SHIPS,
				{ ships: placements }
			);

			if (response.success) {
				if (response.state) {
					set({ gameState: response.state });
				}
				set({ error: null });
				return true;
			}

			set({ error: response.message || 'Failed to submit ships' });
			return false;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Connection error';
			set({ error: message });
			return false;
		}
	},

	attack: (x, y) => {
		const { gameState, enemyBoard, connected } = get();

		if (!connected) return;
		if (gameState?.phase !== 'attack') return;
		if (gameState.currentTurn !== 'player') return;

		const cell = enemyBoard.cells[y][x];
		if (cell === 'hit' || cell === 'miss') return;

		socketService.send(EVENTS.FIRE, { x, y });
	},

	requestRematch: () => {
		const { gameState, connected } = get();

		if (!connected) return;
		if (gameState?.phase !== 'won' && gameState?.phase !== 'lost') return;

		socketService.send(EVENTS.REQUEST_REMATCH);
	},

	clearSunkMessage: () => set({ lastSunkShip: null }),

	clearError: () => set({ error: null }),

	reset: () => {
		set({
			gameId: null,
			gameState: null,
			playerBoard: makeBoard(),
			enemyBoard: makeBoard(),
			playerShips: makeShips(),
			lastSunkShip: null,
			rematchRequested: false,
			error: null,
		});
	},
}));

export const useGamePhase = () =>
	useMultiplayerStore((s) => s.gameState?.phase ?? null);

export const useIsMyTurn = () =>
	useMultiplayerStore((s) => s.gameState?.currentTurn === 'player');

export const useIsConnected = () => useMultiplayerStore((s) => s.connected);

export const useGameId = () => useMultiplayerStore((s) => s.gameId);
