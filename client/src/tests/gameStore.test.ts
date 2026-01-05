import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGameStore } from '../hooks/useGameStore';

describe('useGameStore', () => {
	// ==========================================
	// INITIALIZATION
	// ==========================================
	describe('initialization', () => {
		it('should create 10x10 player board', () => {
			const { playerBoard } = useGameStore.getState();
			expect(playerBoard.cells).toHaveLength(10);
			expect(playerBoard.cells[0]).toHaveLength(10);
		});

		it('should create 10x10 enemy board', () => {
			const { enemyBoard } = useGameStore.getState();
			expect(enemyBoard.cells).toHaveLength(10);
			expect(enemyBoard.cells[0]).toHaveLength(10);
		});

		it('should initialize all cells as empty', () => {
			const { playerBoard } = useGameStore.getState();
			const allEmpty = playerBoard.cells
				.flat()
				.every((cell) => cell === 'empty');
			expect(allEmpty).toBe(true);
		});

		it('should create 5 ships', () => {
			const { playerShips } = useGameStore.getState();
			expect(playerShips).toHaveLength(5);
		});

		it('should initialize ships as not placed', () => {
			const { playerShips } = useGameStore.getState();
			const allNotPlaced = playerShips.every((ship) => !ship.placed);
			expect(allNotPlaced).toBe(true);
		});

		it('should initialize ships as not sunk', () => {
			const { playerShips } = useGameStore.getState();
			const allNotSunk = playerShips.every((ship) => !ship.sunk);
			expect(allNotSunk).toBe(true);
		});

		it('should start in placement phase', () => {
			const { phase } = useGameStore.getState();
			expect(phase).toBe('placement');
		});

		it('should start with player turn', () => {
			const { turn } = useGameStore.getState();
			expect(turn).toBe('player');
		});

		it('should have empty enemy hits array', () => {
			const { enemyHits } = useGameStore.getState();
			expect(enemyHits).toEqual([]);
		});

		it('should have empty enemy targets array', () => {
			const { enemyTargets } = useGameStore.getState();
			expect(enemyTargets).toEqual([]);
		});

		it('should have no last sunk ship message', () => {
			const { lastSunkShip } = useGameStore.getState();
			expect(lastSunkShip).toBeNull();
		});
	});

	// ==========================================
	// SHIP PLACEMENT
	// ==========================================
	describe('placeShip', () => {
		it('should place ship horizontally', () => {
			const { placeShip } = useGameStore.getState();

			placeShip(1, 0, 0, true); // Carrier at (0,0) horizontal

			const { playerBoard } = useGameStore.getState();
			expect(playerBoard.cells[0][0]).toBe('ship');
			expect(playerBoard.cells[0][1]).toBe('ship');
			expect(playerBoard.cells[0][2]).toBe('ship');
			expect(playerBoard.cells[0][3]).toBe('ship');
			expect(playerBoard.cells[0][4]).toBe('ship');
		});

		it('should place ship vertically', () => {
			const { placeShip } = useGameStore.getState();

			placeShip(1, 0, 0, false); // Carrier at (0,0) vertical

			const { playerBoard } = useGameStore.getState();
			expect(playerBoard.cells[0][0]).toBe('ship');
			expect(playerBoard.cells[1][0]).toBe('ship');
			expect(playerBoard.cells[2][0]).toBe('ship');
			expect(playerBoard.cells[3][0]).toBe('ship');
			expect(playerBoard.cells[4][0]).toBe('ship');
		});

		it('should mark ship as placed', () => {
			const { placeShip } = useGameStore.getState();

			placeShip(1, 0, 0, true);

			const { playerShips } = useGameStore.getState();
			const carrier = playerShips.find((s) => s.id === 1);
			expect(carrier?.placed).toBe(true);
		});

		it('should store ship positions', () => {
			const { placeShip } = useGameStore.getState();

			placeShip(5, 0, 0, true); // Destroyer (size 2)

			const { playerShips } = useGameStore.getState();
			const destroyer = playerShips.find((s) => s.id === 5);
			expect(destroyer?.positions).toEqual([
				{ x: 0, y: 0 },
				{ x: 1, y: 0 },
			]);
		});

		it('should reject horizontal placement out of bounds', () => {
			const { placeShip } = useGameStore.getState();

			placeShip(1, 8, 0, true); // Carrier (size 5) at x=8 would overflow

			const { playerShips } = useGameStore.getState();
			const carrier = playerShips.find((s) => s.id === 1);
			expect(carrier?.placed).toBe(false);
		});

		it('should reject vertical placement out of bounds', () => {
			const { placeShip } = useGameStore.getState();

			placeShip(1, 0, 8, false); // Carrier (size 5) at y=8 would overflow

			const { playerShips } = useGameStore.getState();
			const carrier = playerShips.find((s) => s.id === 1);
			expect(carrier?.placed).toBe(false);
		});

		it('should reject overlapping ships', () => {
			const { placeShip } = useGameStore.getState();

			placeShip(1, 0, 0, true); // Carrier horizontal
			placeShip(2, 0, 0, false); // Battleship vertical (overlaps at 0,0)

			const { playerShips } = useGameStore.getState();
			const battleship = playerShips.find((s) => s.id === 2);
			expect(battleship?.placed).toBe(false);
		});

		it('should reject placing already placed ship', () => {
			const { placeShip } = useGameStore.getState();

			placeShip(1, 0, 0, true); // First placement
			placeShip(1, 5, 5, true); // Try to place again

			const { playerBoard } = useGameStore.getState();
			// Should still be at original position
			expect(playerBoard.cells[0][0]).toBe('ship');
			// New position should be empty
			expect(playerBoard.cells[5][5]).toBe('empty');
		});

		it('should allow adjacent ships (not overlapping)', () => {
			const { placeShip } = useGameStore.getState();

			placeShip(5, 0, 0, true); // Destroyer at row 0
			placeShip(4, 0, 1, true); // Submarine at row 1

			const { playerShips } = useGameStore.getState();
			const destroyer = playerShips.find((s) => s.id === 5);
			const submarine = playerShips.find((s) => s.id === 4);
			expect(destroyer?.placed).toBe(true);
			expect(submarine?.placed).toBe(true);
		});
	});

	// ==========================================
	// ATTACK MECHANICS
	// ==========================================
	describe('attack', () => {
		beforeEach(() => {
			vi.useFakeTimers();

			// Setup: Place all player ships and start battle
			const { placeShip, startBattle } = useGameStore.getState();
			placeShip(1, 0, 0, true);
			placeShip(2, 0, 1, true);
			placeShip(3, 0, 2, true);
			placeShip(4, 0, 3, true);
			placeShip(5, 0, 4, true);
			startBattle();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should mark empty cell as miss', () => {
			const { attack, enemyBoard } = useGameStore.getState();

			// Find an empty cell on enemy board
			let emptyX = 0,
				emptyY = 0;
			for (let y = 0; y < 10; y++) {
				for (let x = 0; x < 10; x++) {
					if (enemyBoard.cells[y][x] === 'empty') {
						emptyX = x;
						emptyY = y;
						break;
					}
				}
			}

			attack(emptyX, emptyY);

			const { enemyBoard: updatedBoard } = useGameStore.getState();
			expect(updatedBoard.cells[emptyY][emptyX]).toBe('miss');
		});

		it('should mark ship cell as hit', () => {
			const { attack, enemyShips } = useGameStore.getState();

			// Attack first position of first enemy ship
			const ship = enemyShips[0];
			const pos = ship.positions[0];

			attack(pos.x, pos.y);

			const { enemyBoard } = useGameStore.getState();
			expect(enemyBoard.cells[pos.y][pos.x]).toBe('hit');
		});

		it('should ignore already hit cells', () => {
			const { attack, enemyShips } = useGameStore.getState();
			const pos = enemyShips[0].positions[0];

			attack(pos.x, pos.y); // First attack
			vi.advanceTimersByTime(500);

			// Reset turn to player for second attack
			useGameStore.setState({ turn: 'player' });

			const stateBefore = useGameStore.getState();
			attack(pos.x, pos.y); // Second attack same cell
			const stateAfter = useGameStore.getState();

			expect(stateAfter.turn).toBe(stateBefore.turn); // Turn shouldn't change
		});

		it('should ignore already missed cells', () => {
			const { attack, enemyBoard } = useGameStore.getState();

			// Find empty cell
			let emptyX = 9,
				emptyY = 9;
			for (let y = 0; y < 10; y++) {
				for (let x = 0; x < 10; x++) {
					if (enemyBoard.cells[y][x] === 'empty') {
						emptyX = x;
						emptyY = y;
						break;
					}
				}
			}

			attack(emptyX, emptyY);
			vi.advanceTimersByTime(500);
			useGameStore.setState({ turn: 'player' });

			const stateBefore = useGameStore.getState();
			attack(emptyX, emptyY);
			const stateAfter = useGameStore.getState();

			expect(stateAfter.turn).toBe(stateBefore.turn);
		});

		it('should switch turn to enemy after valid attack', () => {
			const { attack, enemyBoard } = useGameStore.getState();

			// Find empty cell
			let emptyX = 9,
				emptyY = 9;
			outer: for (let y = 9; y >= 0; y--) {
				for (let x = 9; x >= 0; x--) {
					if (enemyBoard.cells[y][x] === 'empty') {
						emptyX = x;
						emptyY = y;
						break outer;
					}
				}
			}

			attack(emptyX, emptyY);

			const { turn } = useGameStore.getState();
			expect(turn).toBe('enemy');
		});

		it('should NOT attack during placement phase', () => {
			useGameStore.setState({ phase: 'placement' });

			const { attack, enemyBoard: before } = useGameStore.getState();
			attack(5, 5);

			const { enemyBoard: after } = useGameStore.getState();
			expect(after.cells[5][5]).toBe(before.cells[5][5]);
		});

		it('should NOT attack during enemy turn', () => {
			useGameStore.setState({ turn: 'enemy' });

			const { attack, enemyBoard: before } = useGameStore.getState();
			attack(5, 5);

			const { enemyBoard: after } = useGameStore.getState();
			expect(after.cells[5][5]).toBe(before.cells[5][5]);
		});

		it('should trigger enemy attack after player attack', () => {
			const { attack, enemyBoard } = useGameStore.getState();

			let emptyX = 9,
				emptyY = 9;
			outer: for (let y = 9; y >= 0; y--) {
				for (let x = 9; x >= 0; x--) {
					if (enemyBoard.cells[y][x] === 'empty') {
						emptyX = x;
						emptyY = y;
						break outer;
					}
				}
			}

			attack(emptyX, emptyY);

			// Before timer, still enemy turn
			expect(useGameStore.getState().turn).toBe('enemy');

			// After timer, enemy attacks and turn switches
			vi.advanceTimersByTime(500);
			expect(useGameStore.getState().turn).toBe('player');
		});
	});

	// ==========================================
	// SUNK DETECTION
	// ==========================================
	describe('ship sinking', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should mark ship as sunk when all positions hit', () => {
			// Setup with known enemy ship position
			const { placeShip, startBattle } = useGameStore.getState();
			placeShip(1, 0, 0, true);
			placeShip(2, 0, 1, true);
			placeShip(3, 0, 2, true);
			placeShip(4, 0, 3, true);
			placeShip(5, 0, 4, true);
			startBattle();

			const { enemyShips, attack } = useGameStore.getState();
			const destroyer = enemyShips.find((s) => s.size === 2)!;

			// Hit all positions
			destroyer.positions.forEach((pos, index) => {
				useGameStore.setState({ turn: 'player', phase: 'attack' });
				attack(pos.x, pos.y);
				if (index < destroyer.positions.length - 1) {
					vi.advanceTimersByTime(500);
				}
			});

			const { enemyShips: updated } = useGameStore.getState();
			const sunkDestroyer = updated.find((s) => s.id === destroyer.id);
			expect(sunkDestroyer?.sunk).toBe(true);
		});

		it('should set lastSunkShip message when ship sinks', () => {
			const { placeShip, startBattle } = useGameStore.getState();
			placeShip(1, 0, 0, true);
			placeShip(2, 0, 1, true);
			placeShip(3, 0, 2, true);
			placeShip(4, 0, 3, true);
			placeShip(5, 0, 4, true);
			startBattle();

			const { enemyShips, attack } = useGameStore.getState();
			const destroyer = enemyShips.find((s) => s.size === 2)!;

			destroyer.positions.forEach((pos, index) => {
				useGameStore.setState({ turn: 'player', phase: 'attack' });
				attack(pos.x, pos.y);
				if (index < destroyer.positions.length - 1) {
					vi.advanceTimersByTime(500);
				}
			});

			const { lastSunkShip } = useGameStore.getState();
			expect(lastSunkShip).toContain('sunk');
			expect(lastSunkShip).toContain(destroyer.name);
		});

		it('should clear sunk message with clearSunkMessage', () => {
			useGameStore.setState({
				lastSunkShip: 'You sunk their Destroyer!',
			});

			const { clearSunkMessage } = useGameStore.getState();
			clearSunkMessage();

			const { lastSunkShip } = useGameStore.getState();
			expect(lastSunkShip).toBeNull();
		});
	});

	// ==========================================
	// WIN/LOSE CONDITIONS
	// ==========================================
	describe('game end conditions', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should set phase to "won" when all enemy ships sunk', () => {
			const { placeShip, startBattle } = useGameStore.getState();
			placeShip(1, 0, 0, true);
			placeShip(2, 0, 1, true);
			placeShip(3, 0, 2, true);
			placeShip(4, 0, 3, true);
			placeShip(5, 0, 4, true);
			startBattle();

			const { enemyShips, attack } = useGameStore.getState();

			// Sink all ships
			enemyShips.forEach((ship) => {
				ship.positions.forEach((pos) => {
					useGameStore.setState({ turn: 'player', phase: 'attack' });
					attack(pos.x, pos.y);
					vi.advanceTimersByTime(500);
				});
			});

			const { phase } = useGameStore.getState();
			expect(phase).toBe('won');
		});

		it('should set phase to "lost" when all player ships sunk', () => {
			// Manually setup a losing scenario
			const positions = [
				{ x: 0, y: 0 },
				{ x: 1, y: 0 },
			];

			useGameStore.setState({
				phase: 'attack',
				turn: 'enemy',
				playerShips: [
					{
						id: 5,
						name: 'Destroyer',
						size: 2,
						positions,
						placed: true,
						sunk: false,
					},
				],
				playerBoard: {
					cells: (() => {
						const cells = Array.from({ length: 10 }, () =>
							Array(10).fill('empty')
						);
						cells[0][0] = 'ship';
						cells[0][1] = 'ship';
						return cells;
					})(),
				},
			});

			// Mock random to attack ship positions
			// let attackIndex = 0;
			vi.spyOn(Math, 'random').mockImplementation(() => {
				return 0; // Will hit (0,0) then (1,0)
			});

			const { enemyAttack } = useGameStore.getState();
			enemyAttack(); // Hit (0,0)

			useGameStore.setState({ turn: 'enemy' });
			useGameStore.getState().enemyAttack(); // Hit (1,0)

			const { phase } = useGameStore.getState();
			expect(phase).toBe('lost');

			vi.restoreAllMocks();
		});
	});

	// ==========================================
	// ENEMY AI
	// ==========================================
	describe('enemyAttack', () => {
		beforeEach(() => {
			useGameStore.setState({
				phase: 'attack',
				turn: 'enemy',
				playerBoard: {
					cells: Array.from({ length: 10 }, () =>
						Array(10).fill('empty')
					),
				},
				playerShips: [
					{
						id: 1,
						name: 'Carrier',
						size: 5,
						positions: [
							{ x: 0, y: 0 },
							{ x: 1, y: 0 },
							{ x: 2, y: 0 },
							{ x: 3, y: 0 },
							{ x: 4, y: 0 },
						],
						placed: true,
						sunk: false,
					},
				],
			});

			// Mark ship cells
			const { playerBoard } = useGameStore.getState();
			playerBoard.cells[0][0] = 'ship';
			playerBoard.cells[0][1] = 'ship';
			playerBoard.cells[0][2] = 'ship';
			playerBoard.cells[0][3] = 'ship';
			playerBoard.cells[0][4] = 'ship';
		});

		it('should attack a cell', () => {
			vi.spyOn(Math, 'random').mockReturnValue(0.5);

			const beforeCells = useGameStore
				.getState()
				.playerBoard.cells.flat()
				.filter((c) => c === 'hit' || c === 'miss').length;

			useGameStore.getState().enemyAttack();

			const afterCells = useGameStore
				.getState()
				.playerBoard.cells.flat()
				.filter((c) => c === 'hit' || c === 'miss').length;

			expect(afterCells).toBe(beforeCells + 1);

			vi.restoreAllMocks();
		});

		it('should add adjacent cells to targets after hit', () => {
			// Force attack on ship cell
			vi.spyOn(Math, 'random').mockReturnValue(0);

			useGameStore.getState().enemyAttack();

			const { enemyTargets } = useGameStore.getState();
			expect(enemyTargets.length).toBeGreaterThan(0);

			vi.restoreAllMocks();
		});

		it('should prioritize targets over random', () => {
			useGameStore.setState({
				enemyTargets: [{ x: 5, y: 5 }],
			});

			useGameStore.getState().enemyAttack();

			const { playerBoard } = useGameStore.getState();
			expect(playerBoard.cells[5][5]).toBe('miss');
		});

		it('should switch turn back to player', () => {
			vi.spyOn(Math, 'random').mockReturnValue(0.9);

			useGameStore.getState().enemyAttack();

			const { turn } = useGameStore.getState();
			expect(turn).toBe('player');

			vi.restoreAllMocks();
		});

		it('should NOT attack during placement phase', () => {
			useGameStore.setState({ phase: 'placement' });

			const before = JSON.stringify(useGameStore.getState().playerBoard);
			useGameStore.getState().enemyAttack();
			const after = JSON.stringify(useGameStore.getState().playerBoard);

			expect(before).toBe(after);
		});

		it('should NOT attack during player turn', () => {
			useGameStore.setState({ turn: 'player' });

			const before = JSON.stringify(useGameStore.getState().playerBoard);
			useGameStore.getState().enemyAttack();
			const after = JSON.stringify(useGameStore.getState().playerBoard);

			expect(before).toBe(after);
		});
	});

	// ==========================================
	// RANDOMIZE SHIPS
	// ==========================================
	describe('randomizePlayerShips', () => {
		it('should place all ships', () => {
			useGameStore.getState().randomizePlayerShips();

			const { playerShips } = useGameStore.getState();
			const allPlaced = playerShips.every((ship) => ship.placed);
			expect(allPlaced).toBe(true);
		});

		it('should have 17 ship cells on board', () => {
			useGameStore.getState().randomizePlayerShips();

			const { playerBoard } = useGameStore.getState();
			const shipCells = playerBoard.cells
				.flat()
				.filter((c) => c === 'ship');
			expect(shipCells.length).toBe(17); // 5+4+3+3+2
		});

		it('should not have overlapping ships', () => {
			useGameStore.getState().randomizePlayerShips();

			const { playerShips } = useGameStore.getState();
			const allPositions = playerShips.flatMap((s) => s.positions);
			const positionStrings = allPositions.map((p) => `${p.x},${p.y}`);
			const uniquePositions = new Set(positionStrings);

			expect(uniquePositions.size).toBe(allPositions.length);
		});

		it('should store positions for each ship', () => {
			useGameStore.getState().randomizePlayerShips();

			const { playerShips } = useGameStore.getState();
			playerShips.forEach((ship) => {
				expect(ship.positions.length).toBe(ship.size);
			});
		});
	});

	// ==========================================
	// START BATTLE
	// ==========================================
	describe('startBattle', () => {
		it('should NOT start if not all ships placed', () => {
			const { startBattle } = useGameStore.getState();
			startBattle();

			const { phase } = useGameStore.getState();
			expect(phase).toBe('placement');
		});

		it('should change phase to attack when all ships placed', () => {
			const { placeShip, startBattle } = useGameStore.getState();

			placeShip(1, 0, 0, true);
			placeShip(2, 0, 1, true);
			placeShip(3, 0, 2, true);
			placeShip(4, 0, 3, true);
			placeShip(5, 0, 4, true);

			startBattle();

			const { phase } = useGameStore.getState();
			expect(phase).toBe('attack');
		});

		it('should set turn to player', () => {
			const { placeShip, startBattle } = useGameStore.getState();

			placeShip(1, 0, 0, true);
			placeShip(2, 0, 1, true);
			placeShip(3, 0, 2, true);
			placeShip(4, 0, 3, true);
			placeShip(5, 0, 4, true);

			startBattle();

			const { turn } = useGameStore.getState();
			expect(turn).toBe('player');
		});

		it('should place enemy ships', () => {
			const { placeShip, startBattle } = useGameStore.getState();

			placeShip(1, 0, 0, true);
			placeShip(2, 0, 1, true);
			placeShip(3, 0, 2, true);
			placeShip(4, 0, 3, true);
			placeShip(5, 0, 4, true);

			startBattle();

			const { enemyShips } = useGameStore.getState();
			expect(enemyShips.length).toBe(5);
			expect(enemyShips.every((s) => s.placed)).toBe(true);
		});
	});

	// ==========================================
	// RESET
	// ==========================================
	describe('reset', () => {
		it('should reset to initial state', () => {
			// Make some changes
			useGameStore.setState({
				phase: 'won',
				turn: 'enemy',
				lastSunkShip: 'Test',
			});

			useGameStore.getState().reset();

			const state = useGameStore.getState();
			expect(state.phase).toBe('placement');
			expect(state.turn).toBe('player');
			expect(state.lastSunkShip).toBeNull();
		});

		it('should clear all boards', () => {
			useGameStore.getState().randomizePlayerShips();
			useGameStore.getState().reset();

			const { playerBoard, enemyBoard } = useGameStore.getState();
			const playerEmpty = playerBoard.cells
				.flat()
				.every((c) => c === 'empty');
			const enemyEmpty = enemyBoard.cells
				.flat()
				.every((c) => c === 'empty');

			expect(playerEmpty).toBe(true);
			expect(enemyEmpty).toBe(true);
		});

		it('should reset all ships to unplaced', () => {
			useGameStore.getState().randomizePlayerShips();
			useGameStore.getState().reset();

			const { playerShips } = useGameStore.getState();
			const allUnplaced = playerShips.every((s) => !s.placed);
			expect(allUnplaced).toBe(true);
		});
	});
});
