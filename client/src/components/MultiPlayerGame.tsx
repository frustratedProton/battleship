import { useEffect, useState } from 'react';
import { useMultiplayerStore } from '../hooks/useMultiplayerStore';
import Grid from './Grid';
import EnemyBoard from './EnemyGrid';
import BoardContainer from './BoardContainer';
import PlayerControls from './PlayerControls';
import SunkNotification from './SunkNotification';
import EndScreen from './EndScreen';

interface MultiPlayerGameProps {
	onBack: () => void;
}

const MultiPlayerGame = ({ onBack }: MultiPlayerGameProps) => {
	const store = useMultiplayerStore();
	const [horizontal, setHorizontal] = useState(true);
	const [selectedShip, setSelectedShip] = useState<number | null>(1);
	const [inputCode, setInputCode] = useState('');

	useEffect(() => {
		console.log('🔌 MultiPlayerGame mounted. Connecting...');
		store.connect();

		return () => {
			console.log('🔌 MultiPlayerGame unmounting. Disconnecting...');
			store.disconnect();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (store.gameState && !store.gameId) {
			console.warn(
				'State mismatch: We have game data but no ID. Forcing view update.'
			);
			useMultiplayerStore.setState({ gameId: 'ACTIVE' });
		}
	}, [store.gameState, store.gameId]);

	const handleCreateGame = async () => {
		console.log('Creating game...');
		const id = await store.createGame();
		console.log('Create Game Result:', id);
	};

	const handleJoinGame = async () => {
		console.log('Joining game:', inputCode);
		await store.joinGame(inputCode);
	};

	const handlePlaceShip = (x: number, y: number) => {
		if (store.gameState?.phase === 'placement' && selectedShip) {
			store.placeShip(selectedShip, x, y, horizontal);
		}
	};

	if (!store.gameId) {
		return (
			<div className="flex flex-col items-center w-full max-w-md mx-auto animate-in zoom-in-95 duration-200">
				<button
					onClick={onBack}
					className="self-start mb-6 text-slate-500 hover:text-slate-800"
				>
					← Back
				</button>

				<div className="bg-white p-8 rounded-2xl shadow-xl w-full">
					<h2 className="text-2xl font-bold mb-6 text-center text-slate-800">
						Multiplayer Lobby
					</h2>

					{store.error && (
						<div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
							{store.error}
						</div>
					)}

					{store.connecting ? (
						<div className="text-center py-8 text-slate-500">
							Connecting to server...
						</div>
					) : (
						<>
							<button
								onClick={handleCreateGame}
								className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors mb-4"
							>
								Create New Game
							</button>

							<div className="relative flex py-4 items-center">
								<div className="flex-grow border-t border-slate-200"></div>
								<span className="flex-shrink mx-4 text-slate-400 text-sm">
									OR JOIN
								</span>
								<div className="flex-grow border-t border-slate-200"></div>
							</div>

							<div className="flex gap-2">
								<input
									type="text"
									placeholder="Enter Game Code"
									className="flex-1 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
									value={inputCode}
									onChange={(e) =>
										setInputCode(
											e.target.value.toUpperCase()
										)
									}
								/>
								<button
									onClick={handleJoinGame}
									className="px-6 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors"
								>
									Join
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		);
	}

	const phase = store.gameState?.phase || 'placement';
	const isMyTurn = store.gameState?.currentTurn === 'player';

	return (
		<div className="flex flex-col items-center w-full animate-in fade-in duration-300">
			<div className="w-full flex justify-between items-center mb-6">
				<button
					onClick={onBack}
					className="text-slate-500 hover:text-red-500 transition-colors"
				>
					← Leave Game
				</button>
				<div className="bg-slate-200 px-4 py-1.5 rounded-full text-slate-700 text-sm">
					Room Code:{' '}
					<span className="font-mono font-bold select-all">
						{store.gameId}
					</span>
				</div>
			</div>

			<div className="mb-6 text-xl font-bold text-center">
				{phase === 'placement' && 'Place Your Ships'}
				{phase === 'ready' && 'Waiting for Opponent...'}
				{phase === 'attack' &&
					(isMyTurn ? (
						<span className="text-emerald-500">
							Your Turn to Attack
						</span>
					) : (
						<span className="text-red-500">Opponent's Turn</span>
					))}
				{phase === 'won' && (
					<span className="text-emerald-600 text-3xl">VICTORY!</span>
				)}
				{phase === 'lost' && (
					<span className="text-red-600 text-3xl">DEFEAT!</span>
				)}
			</div>

			{store.error && (
				<div className="fixed top-20 bg-red-500 text-white px-6 py-2 rounded-full shadow-lg z-50 animate-bounce">
					{store.error}
				</div>
			)}

			{phase === 'placement' && (
				<PlayerControls
					horizontal={horizontal}
					setHorizontal={setHorizontal}
					selectedShip={selectedShip}
					setSelectedShip={setSelectedShip}
					ships={store.playerShips}
					onRandomize={store.randomizeShips}
					onReset={store.clearPlacement}
				/>
			)}

			<div className="flex flex-col md:flex-row gap-12 items-start mt-4">
				<BoardContainer title="Your Board">
					<Grid
						board={store.playerBoard}
						ships={store.playerShips}
						phase={phase}
						horizontal={horizontal}
						selectedShip={selectedShip}
						onPlace={handlePlaceShip}
					/>
				</BoardContainer>

				<BoardContainer title="Enemy Board">
					<EnemyBoard
						board={store.enemyBoard}
						ships={[]} // don't show enemy ships in MP
						phase={phase}
						onAttack={(x, y) => {
							if (isMyTurn) store.attack(x, y);
						}}
					/>
				</BoardContainer>
			</div>

			{phase === 'placement' && (
				<button
					onClick={store.submitShips}
					className="mt-8 px-8 py-3 rounded-xl bg-emerald-500 text-white text-xl font-bold hover:bg-emerald-600 shadow-lg transform transition active:scale-95"
				>
					Ready Up
				</button>
			)}

			{(phase === 'won' || phase === 'lost') && (
				<>
					{store.rematchRequested ? (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
							<div className="bg-white p-6 rounded-xl shadow-2xl animate-pulse">
								<h2 className="text-xl font-bold text-slate-800">
									Rematch Requested...
								</h2>
								<p className="text-slate-600 mt-2">
									Waiting for opponent to accept.
								</p>
								<button
									onClick={onBack}
									className="mt-4 text-red-500 text-sm hover:underline"
								>
									Cancel & Quit
								</button>
							</div>
						</div>
					) : (
						<EndScreen
							won={phase === 'won'}
							onReset={store.requestRematch}
							onQuit={onBack}
						/>
					)}
				</>
			)}

			<SunkNotification />
		</div>
	);
};

export default MultiPlayerGame;
