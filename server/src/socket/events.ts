export const EVENTS = {
	// Client -> Server
	CREATE_GAME: 'create_game',
	JOIN_GAME: 'join_game',
	PLACE_SHIPS: 'place_ships',
	FIRE: 'fire',
	REQUEST_REMATCH: 'request_rematch',

	// Server -> Client
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

	// Standard Socket.IO events
	DISCONNECT: 'disconnect',
	CONNECT: 'connect',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
