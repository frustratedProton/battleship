import { describe, it, expect } from 'vitest';
import { SHIP_DEFINITIONS } from '../ships.config';

describe('SHIP_DEFINITIONS', () => {
	it('should have 5 ships', () => {
		expect(SHIP_DEFINITIONS).toHaveLength(5);
	});

	it('should have unique ids', () => {
		const ids = SHIP_DEFINITIONS.map((s) => s.id);
		const uniqueIds = new Set(ids);
		expect(uniqueIds.size).toBe(ids.length);
	});

	it('should have unique names', () => {
		const names = SHIP_DEFINITIONS.map((s) => s.name);
		const uniqueNames = new Set(names);
		expect(uniqueNames.size).toBe(names.length);
	});

	it('should have valid sizes (2-5)', () => {
		SHIP_DEFINITIONS.forEach((ship) => {
			expect(ship.size).toBeGreaterThanOrEqual(2);
			expect(ship.size).toBeLessThanOrEqual(5);
		});
	});

	it('should have correct total cells (17)', () => {
		const totalCells = SHIP_DEFINITIONS.reduce(
			(sum, ship) => sum + ship.size,
			0
		);
		expect(totalCells).toBe(17); // 5 + 4 + 3 + 3 + 2
	});

	it('should include required ship types', () => {
		const names = SHIP_DEFINITIONS.map((s) => s.name);
		expect(names).toContain('Carrier');
		expect(names).toContain('Battleship');
		expect(names).toContain('Destroyer');
	});
});
