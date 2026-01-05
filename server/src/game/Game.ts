import { Player } from './Player';
import {
	ShipPlacement,
	FireResult,
	GamePhase,
	GameState,
	Turn,
} from '../types';

export class Game {
	public readonly id: string;
	private host: Player;
	private guest: Player | null = null;
	private currentTurnId: string;
	private _phase: GamePhase = 'waiting';
	private winnerId: string | null = null;
	private rematchRequests: Set<string> = new Set();

	constructor(id: string, hostId: string) {
		this.id = id;
		this.host = new Player(hostId);
		this.currentTurnId = hostId;
	}


	public addPlayer(playerId: string): boolean {
		if (this.host.id === playerId) return true;


        return this.addGuest(playerId);
	}

	public addGuest(guestId: string): boolean {
		if (this.guest) return false;
		this.guest = new Player(guestId);
		this._phase = 'placement';
		return true;
	}

	public removePlayer(playerId: string): void {
		if (this.host.id === playerId) {
			this.host.setConnected(false);
		} else if (this.guest?.id === playerId) {
			this.guest = null;

			if (this._phase !== 'waiting') {
				this._phase = 'waiting';
				this.host.reset();
				this.winnerId = null;
				this.rematchRequests.clear();
			}
		}
	}

	public getPlayer(playerId: string): Player | null {
		if (this.host.id === playerId) return this.host;
		if (this.guest?.id === playerId) return this.guest;
		return null;
	}

	public getOpponent(playerId: string): Player | null {
		if (this.host.id === playerId) return this.guest;
		if (this.guest?.id === playerId) return this.host;
		return null;
	}

	public getOpponentId(playerId: string): string | null {
		return this.getOpponent(playerId)?.id || null;
	}

	public isHost(playerId: string): boolean {
		return this.host.id === playerId;
	}


	public placeShips(playerId: string, placements: ShipPlacement[]): boolean {
		if (this._phase !== 'placement') return false;

		const player = this.getPlayer(playerId);
		if (!player) return false;

		return player.placeShips(placements);
	}

	public bothPlayersReady(): boolean {
		return this.host.ready && (this.guest?.ready ?? false);
	}

	public startGame(): boolean {
		if (!this.bothPlayersReady()) return false;

		this._phase = 'attack';
		this.currentTurnId =
			Math.random() < 0.5 ? this.host.id : this.guest!.id;

		return true;
	}


	public get phase(): GamePhase {
		return this._phase;
	}

	public getCurrentTurnId(): string {
		return this.currentTurnId;
	}

	public isPlayerTurn(playerId: string): boolean {
		return this._phase === 'attack' && this.currentTurnId === playerId;
	}

	public fire(attackerId: string, x: number, y: number): FireResult {
		if (this._phase !== 'attack') {
			throw new Error('Game not in attack phase');
		}

		if (!this.isPlayerTurn(attackerId)) {
			throw new Error('Not your turn');
		}

		const defender = this.getOpponent(attackerId);
		if (!defender) {
			throw new Error('No opponent');
		}

		const result = defender.receiveAttack(x, y);

		if (result.gameOver) {
			this._phase = 'attack';
			this.winnerId = attackerId;
			result.winner = attackerId;
		} else {
			this.currentTurnId = defender.id;
		}

		return result;
	}

	public getWinnerId(): string | null {
		return this.winnerId;
	}


	public getTurnForPlayer(playerId: string): Turn | null {
		if (this._phase !== 'attack') return null;
		return this.currentTurnId === playerId ? 'player' : 'opponent';
	}


	public getPhaseForPlayer(playerId: string): GamePhase {
		if (this.winnerId) {
			return this.winnerId === playerId ? 'won' : 'lost';
		}

		if (this._phase === 'placement') {
			const player = this.getPlayer(playerId);
			const opponent = this.getOpponent(playerId);

			if (player?.ready && !opponent?.ready) {
				return 'ready';
			}
		}

		return this._phase;
	}

	public requestRematch(playerId: string): boolean {
		if (!this.winnerId) return false;

		this.rematchRequests.add(playerId);

		if (this.rematchRequests.size === 2) {
			this.resetForRematch();
			return true;
		}

		return false;
	}

	public hasRequestedRematch(playerId: string): boolean {
		return this.rematchRequests.has(playerId);
	}

	private resetForRematch(): void {
		this.host.reset();
		this.guest?.reset();
		this._phase = 'placement';
		this.winnerId = null;
		this.rematchRequests.clear();
	}


	public setPlayerConnected(playerId: string, connected: boolean): void {
		this.getPlayer(playerId)?.setConnected(connected);
	}

	public isFull(): boolean {
		return this.guest !== null;
	}

	public isEmpty(): boolean {
		return !this.host.connected && !this.guest?.connected;
	}

	public getPlayerIds(): string[] {
		const ids = [this.host.id];
		if (this.guest) ids.push(this.guest.id);
		return ids;
	}


	public getStateForPlayer(playerId: string): GameState {
		const opponent = this.getOpponent(playerId);

		return {
			gameId: this.id,
			phase: this.getPhaseForPlayer(playerId),
			isHost: this.isHost(playerId),
			opponentConnected: opponent?.connected ?? false,
			opponentReady: opponent?.ready ?? false,
			currentTurn: this.getTurnForPlayer(playerId),
			winner: this.winnerId
				? this.winnerId === playerId
					? 'player'
					: 'opponent'
				: null,
		};
	}
}
