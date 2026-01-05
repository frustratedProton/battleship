import { describe, it, expect } from 'vitest';
import type { Ship, Board } from '../types/game';

// Extract helper for testing (or export it from store)
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
				// ← Add this check
				newlySunk = sunkShip;
			}
			return sunkShip;
		}

		return ship;
	});

	return { ships: updatedShips, newlySunk };
};

describe('checkAndMarkSunkShips', () => {
	const createBoard = (): Board => ({
		cells: Array.from({ length: 10 }, () => Array(10).fill('empty')),
	});

	it('should not mark ship as sunk if not all positions hit', () => {
		const board = createBoard();
		board.cells[0][0] = 'hit';
		board.cells[0][1] = 'ship'; // Not hit yet

		const ships: Ship[] = [
			{
				id: 1,
				name: 'Destroyer',
				size: 2,
				positions: [
					{ x: 0, y: 0 },
					{ x: 1, y: 0 },
				],
				placed: true,
				sunk: false,
			},
		];

		const { ships: updated, newlySunk } = checkAndMarkSunkShips(
			ships,
			board
		);

		expect(updated[0].sunk).toBe(false);
		expect(newlySunk).toBeNull();
	});

	it('should mark ship as sunk when all positions hit', () => {
		const board = createBoard();
		board.cells[0][0] = 'hit';
		board.cells[0][1] = 'hit';

		const ships: Ship[] = [
			{
				id: 1,
				name: 'Destroyer',
				size: 2,
				positions: [
					{ x: 0, y: 0 },
					{ x: 1, y: 0 },
				],
				placed: true,
				sunk: false,
			},
		];

		const { ships: updated, newlySunk } = checkAndMarkSunkShips(
			ships,
			board
		);

		expect(updated[0].sunk).toBe(true);
		expect(newlySunk?.name).toBe('Destroyer');
	});

	it('should not re-process already sunk ships', () => {
		const board = createBoard();
		board.cells[0][0] = 'hit';
		board.cells[0][1] = 'hit';

		const ships: Ship[] = [
			{
				id: 1,
				name: 'Destroyer',
				size: 2,
				positions: [
					{ x: 0, y: 0 },
					{ x: 1, y: 0 },
				],
				placed: true,
				sunk: true, // Already sunk
			},
		];

		const { newlySunk } = checkAndMarkSunkShips(ships, board);

		expect(newlySunk).toBeNull(); // Should not report as newly sunk
	});

	it('should only return first newly sunk ship', () => {
		const board = createBoard();
		board.cells[0][0] = 'hit';
		board.cells[0][1] = 'hit';
		board.cells[1][0] = 'hit';
		board.cells[1][1] = 'hit';
		board.cells[1][2] = 'hit';

		const ships: Ship[] = [
			{
				id: 1,
				name: 'Destroyer',
				size: 2,
				positions: [
					{ x: 0, y: 0 },
					{ x: 1, y: 0 },
				],
				placed: true,
				sunk: false,
			},
			{
				id: 2,
				name: 'Cruiser',
				size: 3,
				positions: [
					{ x: 0, y: 1 },
					{ x: 1, y: 1 },
					{ x: 2, y: 1 },
				],
				placed: true,
				sunk: false,
			},
		];

		const { ships: updated, newlySunk } = checkAndMarkSunkShips(
			ships,
			board
		);

		expect(updated[0].sunk).toBe(true);
		expect(updated[1].sunk).toBe(true);
		// First one found
		expect(newlySunk?.name).toBe('Destroyer');
	});
});
