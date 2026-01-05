import { Server, Socket } from 'socket.io';
import { GameManager } from '../game/GameManager';
import { EVENTS } from './events';
import { ShipPlacement } from '../types';

export function setupSocketHandlers(
	io: Server,
	socket: Socket,
	gameManager: GameManager
): void {
	// console.log(`[${socket.id}] Connected`);

    socket.on(
		EVENTS.CREATE_GAME,
		(_data: any, callback?: (res: any) => void) => {
			if (typeof _data === 'function') {
				callback = _data;
			}

			try {
				const game = gameManager.createGame(socket.id);
				socket.join(game.id);

				const response = {
					success: true,
					gameId: game.id,
					state: game.getStateForPlayer(socket.id),
				};

				socket.emit(EVENTS.GAME_CREATED, response);

				if (typeof callback === 'function') {
					callback(response);
				}

				// console.log(`[${socket.id}] Created game ${game.id}`);
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: 'Failed to create game';
				socket.emit(EVENTS.ERROR, { message });

				if (typeof callback === 'function') {
					callback({ success: false, message });
				}
			}
		}
	);

	socket.on(
		EVENTS.JOIN_GAME,
		({ gameId }: { gameId: string }, callback?: (res: any) => void) => {
			try {
				const game = gameManager.joinGame(gameId, socket.id);

				if (!game) {
					const response = {
						success: false,
						message: 'Game not found or full',
					};
					socket.emit(EVENTS.ERROR, response);
					callback?.(response);
					return;
				}

				socket.join(game.id);

				const response = {
					success: true,
					gameId: game.id,
					state: game.getStateForPlayer(socket.id),
				};
				socket.emit(EVENTS.GAME_JOINED, response);
				callback?.(response);

				const hostId = game.getOpponentId(socket.id);
				if (hostId) {
					io.to(hostId).emit(EVENTS.PLAYER_JOINED, {
						state: game.getStateForPlayer(hostId),
					});
				}

				// console.log(`[${socket.id}] Joined game ${game.id}`);
			} catch (err) {
				const message =
					err instanceof Error ? err.message : 'Failed to join game';
				socket.emit(EVENTS.ERROR, { message });
				callback?.({ success: false, message });
			}
		}
	);


	socket.on(
		EVENTS.PLACE_SHIPS,
		(
			{ ships }: { ships: ShipPlacement[] },
			callback?: (res: any) => void
		) => {
			try {
				const game = gameManager.getGameByPlayer(socket.id);
				if (!game) {
					const response = {
						success: false,
						message: 'Not in a game',
					};
					socket.emit(EVENTS.ERROR, response);
					callback?.(response);
					return;
				}

				const success = game.placeShips(socket.id, ships);
				if (!success) {
					const response = {
						success: false,
						message: 'Invalid ship placement',
					};
					socket.emit(EVENTS.ERROR, response);
					callback?.(response);
					return;
				}

				socket.emit(EVENTS.SHIPS_PLACED, {
					success: true,
					state: game.getStateForPlayer(socket.id),
				});
				callback?.({ success: true });

				const opponentId = game.getOpponentId(socket.id);
				if (opponentId) {
					io.to(opponentId).emit(EVENTS.OPPONENT_READY, {
						state: game.getStateForPlayer(opponentId),
					});
				}

				if (game.bothPlayersReady()) {
					game.startGame();

					for (const playerId of game.getPlayerIds()) {
						io.to(playerId).emit(EVENTS.GAME_START, {
							state: game.getStateForPlayer(playerId),
						});
					}

					// console.log(`[Game ${game.id}] Started!`);
				}

				// console.log(`[${socket.id}] Ships placed`);
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: 'Failed to place ships';
				socket.emit(EVENTS.ERROR, { message });
				callback?.({ success: false, message });
			}
		}
	);


	socket.on(
		EVENTS.FIRE,
		({ x, y }: { x: number; y: number }, callback?: (res: any) => void) => {
			try {
				const game = gameManager.getGameByPlayer(socket.id);
				if (!game) {
					const response = {
						success: false,
						message: 'Not in a game',
					};
					socket.emit(EVENTS.ERROR, response);
					callback?.(response);
					return;
				}

				if (!game.isPlayerTurn(socket.id)) {
					const response = {
						success: false,
						message: 'Not your turn',
					};
					socket.emit(EVENTS.ERROR, response);
					callback?.(response);
					return;
				}

				const result = game.fire(socket.id, x, y);

				socket.emit(EVENTS.FIRE_RESULT, {
					...result,
					state: game.getStateForPlayer(socket.id),
				});
				callback?.({ success: true, result });

				const opponentId = game.getOpponentId(socket.id);
				if (opponentId) {
					io.to(opponentId).emit(EVENTS.OPPONENT_FIRED, {
						x,
						y,
						hit: result.hit,
						sunk: result.sunk,
						sunkShip: result.sunkShip,
						state: game.getStateForPlayer(opponentId),
					});
				}

				if (result.gameOver) {
					for (const playerId of game.getPlayerIds()) {
						io.to(playerId).emit(EVENTS.GAME_OVER, {
							state: game.getStateForPlayer(playerId),
						});
					}
					// console.log(
					// 	`[Game ${game.id}] Game over! Winner: ${socket.id}`
					// );
				}

				// console.log(
				// 	`[${socket.id}] Fired (${x},${y}) - ${
				// 		result.hit ? 'HIT' : 'MISS'
				// 	}`
				// );
			} catch (err) {
				const message =
					err instanceof Error ? err.message : 'Failed to fire';
				socket.emit(EVENTS.ERROR, { message });
				callback?.({ success: false, message });
			}
		}
	);


	socket.on(EVENTS.REQUEST_REMATCH, (callback?: (res: any) => void) => {
		try {
			const game = gameManager.getGameByPlayer(socket.id);
			if (!game) {
				callback?.({ success: false, message: 'Not in a game' });
				return;
			}

			const bothWant = game.requestRematch(socket.id);

			if (bothWant) {
				for (const playerId of game.getPlayerIds()) {
					io.to(playerId).emit(EVENTS.REMATCH_ACCEPTED, {
						state: game.getStateForPlayer(playerId),
					});
				}
			} else {
				const opponentId = game.getOpponentId(socket.id);
				if (opponentId) {
					io.to(opponentId).emit(EVENTS.REMATCH_REQUESTED);
				}
			}

			callback?.({ success: true, bothWant });
		} catch (err) {
			callback?.({ success: false, message: 'Failed' });
		}
	});


	socket.on(EVENTS.DISCONNECT, () => {
		// console.log(`[${socket.id}] Disconnected`);

		const result = gameManager.handleDisconnect(socket.id);
		if (result) {
			io.to(result.opponentId).emit(EVENTS.OPPONENT_DISCONNECTED);

			setTimeout(() => {
				const game = gameManager.getGameByPlayer(socket.id);
				if (game && !game.getPlayer(socket.id)?.connected) {
					gameManager.removePlayerFromGame(socket.id);
				}
			}, 30000);
		}
	});
}
