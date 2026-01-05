import { Game } from './Game';

export class GameManager {
	private games: Map<string, Game> = new Map();
	private playerToGame: Map<string, string> = new Map();

	public createGame(hostId: string): Game {
		this.removePlayerFromGame(hostId);

		const gameId = this.generateGameId();
		const game = new Game(gameId, hostId);

		this.games.set(gameId, game);
		this.playerToGame.set(hostId, gameId);

		// console.log(`Game ${gameId} created by ${hostId}`);
		return game;
	}

	public joinGame(gameId: string, playerId: string): Game | null {
		const game = this.games.get(gameId.toUpperCase());

		if (!game) {
			// console.log(`Game ${gameId} not found`);
			return null;
		}

		if (game.isFull()) {
			// console.log(`Game ${gameId} is full`);
			return null;
		}

		this.removePlayerFromGame(playerId);

		if (game.addPlayer(playerId)) {
			this.playerToGame.set(playerId, game.id);
			// console.log(`Player ${playerId} joined game ${gameId}`);
			return game;
		}

		return null;
	}

	public getGame(gameId: string): Game | null {
		return this.games.get(gameId.toUpperCase()) || null;
	}

	public getGameByPlayer(playerId: string): Game | null {
		const gameId = this.playerToGame.get(playerId);
		if (!gameId) return null;
		return this.games.get(gameId) || null;
	}

	public removePlayerFromGame(playerId: string): void {
		const gameId = this.playerToGame.get(playerId);
		if (!gameId) return;

		const game = this.games.get(gameId);
		if (game) {
			game.removePlayer(playerId);

			if (game.isEmpty()) {
				this.games.delete(gameId);
				// console.log(`Game ${gameId} deleted (empty)`);
			}
		}

		this.playerToGame.delete(playerId);
		// console.log(`Player ${playerId} removed from game ${gameId}`);
	}

	public handleDisconnect(
		playerId: string
	): { game: Game; opponentId: string } | null {
		const game = this.getGameByPlayer(playerId);
		if (!game) return null;

		const opponentId = game.getOpponentId(playerId);
		game.setPlayerConnected(playerId, false);

		return opponentId ? { game, opponentId } : null;
	}

	public handleReconnect(playerId: string, gameId: string): Game | null {
		const game = this.games.get(gameId);
		if (!game) return null;

		const player = game.getPlayer(playerId);
		if (player) {
			player.setConnected(true);
			this.playerToGame.set(playerId, gameId);
			return game;
		}

		return null;
	}

	private generateGameId(): string {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
		let id = '';
		for (let i = 0; i < 6; i++) {
			id += chars.charAt(Math.floor(Math.random() * chars.length));
		}

		// Ensure uniqueness
		if (this.games.has(id)) {
			return this.generateGameId();
		}

		return id;
	}

	public getActiveGamesCount(): number {
		return this.games.size;
	}

	public getStats() {
		return {
			activeGames: this.games.size,
			activePlayers: this.playerToGame.size,
		};
	}
}
