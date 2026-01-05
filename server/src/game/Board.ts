import {
	Position,
	ShipPlacement,
	Ship,
	CellState,
	FireResult,
	BOARD_SIZE,
	SHIP_DEFINITIONS,
} from '../types';

export class Board {
	private grid: CellState[][];
	private ships: Map<number, Ship> = new Map();
	private _ready: boolean = false;

	constructor() {
		this.grid = this.createEmptyGrid();
	}

	private createEmptyGrid(): CellState[][] {
		return Array.from({ length: BOARD_SIZE }, () =>
			Array(BOARD_SIZE).fill('empty')
		);
	}

	private isValidPosition(x: number, y: number): boolean {
		return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
	}

	public placeShips(placements: ShipPlacement[]): boolean {
		this.grid = this.createEmptyGrid();
		this.ships.clear();

		if (placements.length !== SHIP_DEFINITIONS.length) {
			console.error('Must place all 5 ships');
			return false;
		}

		for (const placement of placements) {
			const shipDef = SHIP_DEFINITIONS.find((s) => s.id === placement.id);

			if (!shipDef) {
				console.error(`Invalid ship ID: ${placement.id}`);
				return false;
			}

			if (placement.positions.length !== shipDef.size) {
				console.error(
					`Ship ${shipDef.name} must have ${shipDef.size} positions`
				);
				return false;
			}

			if (!this.validateContiguous(placement.positions)) {
				console.error(`Ship ${shipDef.name} positions not contiguous`);
				return false;
			}

			for (const pos of placement.positions) {
				if (!this.isValidPosition(pos.x, pos.y)) {
					console.error(
						`Position out of bounds: (${pos.x}, ${pos.y})`
					);
					return false;
				}
				if (this.grid[pos.y][pos.x] !== 'empty') {
					console.error(`Overlap at: (${pos.x}, ${pos.y})`);
					return false;
				}
			}

			for (const pos of placement.positions) {
				this.grid[pos.y][pos.x] = 'ship';
			}

			this.ships.set(shipDef.id, {
				...shipDef,
				positions: [...placement.positions],
				placed: true,
				sunk: false,
			});
		}

		this._ready = true;
		return true;
	}

	private validateContiguous(positions: Position[]): boolean {
		if (positions.length <= 1) return true;

		const sorted = [...positions];
		const isHorizontal = sorted.every((p) => p.y === sorted[0].y);
		const isVertical = sorted.every((p) => p.x === sorted[0].x);

		if (!isHorizontal && !isVertical) return false;

		if (isHorizontal) {
			sorted.sort((a, b) => a.x - b.x);
			for (let i = 1; i < sorted.length; i++) {
				if (sorted[i].x !== sorted[i - 1].x + 1) return false;
			}
		} else {
			sorted.sort((a, b) => a.y - b.y);
			for (let i = 1; i < sorted.length; i++) {
				if (sorted[i].y !== sorted[i - 1].y + 1) return false;
			}
		}

		return true;
	}

	public receiveAttack(x: number, y: number): FireResult {
		if (!this.isValidPosition(x, y)) {
			throw new Error(`Invalid position: (${x}, ${y})`);
		}

		const cell = this.grid[y][x];

		if (cell === 'hit' || cell === 'miss') {
			throw new Error('Cell already attacked');
		}

		if (cell === 'empty') {
			this.grid[y][x] = 'miss';
			return { x, y, hit: false, sunk: false, gameOver: false };
		}

		this.grid[y][x] = 'hit';

		let hitShip: Ship | undefined;
		for (const ship of this.ships.values()) {
			if (ship.positions.some((p) => p.x === x && p.y === y)) {
				hitShip = ship;
				break;
			}
		}

		if (!hitShip) {
			throw new Error('Hit cell but no ship found');
		}

		const allHit = hitShip.positions.every(
			(p) => this.grid[p.y][p.x] === 'hit'
		);

		if (allHit) {
			hitShip.sunk = true;
		}

		const gameOver = this.allShipsSunk();

		return {
			x,
			y,
			hit: true,
			sunk: allHit,
			sunkShip: allHit
				? {
						id: hitShip.id,
						name: hitShip.name,
						positions: hitShip.positions,
				  }
				: undefined,
			gameOver,
		};
	}

	public allShipsSunk(): boolean {
		return Array.from(this.ships.values()).every((ship) => ship.sunk);
	}

	public isReady(): boolean {
		return this._ready;
	}

	public getGrid(): CellState[][] {
		return this.grid.map((row) => [...row]);
	}

	public getShips(): Ship[] {
		return Array.from(this.ships.values());
	}

	public reset(): void {
		this.grid = this.createEmptyGrid();
		this.ships.clear();
		this._ready = false;
	}
}
