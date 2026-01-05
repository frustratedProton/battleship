import { Board } from './Board';
import { ShipPlacement, FireResult, Ship } from '../types';

export class Player {
	public readonly id: string;
	public readonly board: Board;
	private _connected: boolean = true;

	constructor(id: string) {
		this.id = id;
		this.board = new Board();
	}

	public get ready(): boolean {
		return this.board.isReady();
	}

	public get connected(): boolean {
		return this._connected;
	}

	public setConnected(value: boolean): void {
		this._connected = value;
	}

	public placeShips(placements: ShipPlacement[]): boolean {
		return this.board.placeShips(placements);
	}

	public receiveAttack(x: number, y: number): FireResult {
		return this.board.receiveAttack(x, y);
	}

	public hasLost(): boolean {
		return this.board.allShipsSunk();
	}

	public getShips(): Ship[] {
		return this.board.getShips();
	}

	public reset(): void {
		this.board.reset();
	}
}
