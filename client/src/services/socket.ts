import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const EVENTS = {
	CREATE_GAME: 'create_game',
	JOIN_GAME: 'join_game',
	PLACE_SHIPS: 'place_ships',
	FIRE: 'fire',
	REQUEST_REMATCH: 'request_rematch',
	GAME_CREATED: 'game_created',
	GAME_JOINED: 'game_joined',
	PLAYER_JOINED: 'player_joined',
	SHIPS_PLACED: 'ships_placed',
	OPPONENT_READY: 'opponent_ready',
	GAME_START: 'game_start',
	FIRE_RESULT: 'fire_result',
	OPPONENT_FIRED: 'opponent_fired',
	TURN_CHANGE: 'turn_change',
	GAME_OVER: 'game_over',
	REMATCH_REQUESTED: 'rematch_requested',
	REMATCH_ACCEPTED: 'rematch_accepted',
	OPPONENT_DISCONNECTED: 'opponent_disconnected',
	OPPONENT_RECONNECTED: 'opponent_reconnected',
	ERROR: 'error',
} as const;

class SocketService {
	private socket: Socket | null = null;

	connect(): Socket {
		if (this.socket?.connected) {
			return this.socket;
		}

		if (this.socket) {
			this.socket.removeAllListeners();
			this.socket.disconnect();
		}

		this.socket = io(SERVER_URL, {
			autoConnect: true,
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
			timeout: 10000,
		});

		return this.socket;
	}

	disconnect(): void {
		if (this.socket) {
			this.socket.removeAllListeners();
			this.socket.disconnect();
			this.socket = null;
		}
	}

	getSocket(): Socket | null {
		return this.socket;
	}

	isConnected(): boolean {
		return this.socket?.connected ?? false;
	}

	emit<T = unknown>(event: string, data?: unknown): Promise<T> {
		return new Promise((resolve, reject) => {
			if (!this.socket?.connected) {
				reject(new Error('Socket not connected'));
				return;
			}

			const timeout = setTimeout(() => {
				reject(new Error('Request timeout'));
			}, 10000);

			this.socket.emit(event, data, (response: T) => {
				clearTimeout(timeout);
				resolve(response);
			});
		});
	}

	send(event: string, data?: unknown): void {
		if (!this.socket?.connected) {
			console.warn('Socket not connected, cannot send:', event);
			return;
		}
		this.socket.emit(event, data);
	}

	on(event: string, callback: (...args: unknown[]) => void): void {
		this.socket?.on(event, callback);
	}

	off(event: string, callback?: (...args: unknown[]) => void): void {
		if (callback) {
			this.socket?.off(event, callback);
		} else {
			this.socket?.off(event);
		}
	}

	removeAllListeners(): void {
		this.socket?.removeAllListeners();
	}
}

export const socketService = new SocketService();
export default socketService;
