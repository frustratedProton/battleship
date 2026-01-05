import { useState, useEffect } from 'react';
import { useMultiplayerStore } from '../hooks/useMultiplayerStore';

export function Lobby() {
	const [joinCode, setJoinCode] = useState('');
	const [isCreating, setIsCreating] = useState(false);
	const [isJoining, setIsJoining] = useState(false);

	const {
		connected,
		connecting,
		gameId,
		gameState,
		error,
		connect,
		createGame,
		joinGame,
		clearError,
	} = useMultiplayerStore();

	useEffect(() => {
		if (!connected && !connecting) {
			connect();
		}
	}, [connect, connected, connecting]);

	useEffect(() => {
		if (error) {
			const timer = setTimeout(clearError, 5000);
			return () => clearTimeout(timer);
		}
	}, [error, clearError]);

	const handleCreateGame = async () => {
		setIsCreating(true);
		try {
			await createGame();
		} finally {
			setIsCreating(false);
		}
	};

	const handleJoinGame = async () => {
		if (!joinCode.trim()) {
			return;
		}
		setIsJoining(true);
		try {
			await joinGame(joinCode);
		} finally {
			setIsJoining(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && joinCode.trim()) {
			handleJoinGame();
		}
	};

	if (connecting) {
		return (
			<div className="lobby">
				<div className="lobby-content">
					<h2>Connecting to server...</h2>
					<div className="spinner" />
				</div>
			</div>
		);
	}

	if (!connected) {
		return (
			<div className="lobby">
				<div className="lobby-content">
					<h2>Disconnected</h2>
					<p>Unable to connect to game server</p>
					<button onClick={connect} className="btn btn-primary">
						Reconnect
					</button>
					{error && <p className="error-message">{error}</p>}
				</div>
			</div>
		);
	}

	if (gameState && gameId) {
		return (
			<div className="lobby">
				<div className="lobby-content">
					<h2>Game: {gameId}</h2>

					{gameState.phase === 'waiting' && (
						<>
							<p>Waiting for opponent to join...</p>
							<div className="game-code-display">
								<span>Share this code:</span>
								<code>{gameId}</code>
								<button
									onClick={() =>
										navigator.clipboard.writeText(gameId)
									}
									className="btn btn-small"
								>
									Copy
								</button>
							</div>
						</>
					)}

					{gameState.phase === 'placement' && (
						<p>Place your ships!</p>
					)}

					{gameState.phase === 'ready' && (
						<p>Waiting for opponent to place ships...</p>
					)}

					<div className="game-status">
						<p>
							<strong>Status:</strong> {gameState.phase}
						</p>
						<p>
							<strong>Opponent:</strong>{' '}
							{gameState.opponentConnected
								? '🟢 Connected'
								: '🔴 Waiting...'}
						</p>
						{gameState.phase === 'attack' && (
							<p>
								<strong>Turn:</strong>{' '}
								{gameState.currentTurn === 'player'
									? 'Your turn!'
									: "Opponent's turn"}
							</p>
						)}
					</div>

					{error && <p className="error-message">{error}</p>}
				</div>
			</div>
		);
	}

	return (
		<div className="lobby">
			<div className="lobby-content">
				<h1>Battleship</h1>
				<h2>Multiplayer</h2>

				<div className="lobby-actions">
					<button
						onClick={handleCreateGame}
						disabled={isCreating || isJoining}
						className="btn btn-primary btn-large"
					>
						{isCreating ? 'Creating...' : 'Create Game'}
					</button>

					<div className="divider">
						<span>OR</span>
					</div>

					<div className="join-game">
						<input
							type="text"
							value={joinCode}
							onChange={(e) =>
								setJoinCode(e.target.value.toUpperCase())
							}
							onKeyPress={handleKeyPress}
							placeholder="Enter game code"
							maxLength={6}
							disabled={isCreating || isJoining}
							className="input-code"
						/>
						<button
							onClick={handleJoinGame}
							disabled={
								!joinCode.trim() || isCreating || isJoining
							}
							className="btn btn-secondary"
						>
							{isJoining ? 'Joining...' : 'Join Game'}
						</button>
					</div>
				</div>

				{error && (
					<div className="error-message">
						<p>{error}</p>
					</div>
				)}
			</div>
		</div>
	);
}
