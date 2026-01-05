import { useState } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import Grid from './Grid';
import EnemyBoard from './EnemyGrid';
import BoardContainer from './BoardContainer';
import PlayerControls from './PlayerControls';
import EndScreen from './EndScreen';
import SunkNotification from './SunkNotification';

interface SinglePlayerGameProps {
	onBack: () => void;
}

const SinglePlayerGame = ({ onBack }: SinglePlayerGameProps) => {
	const {
		phase,
		turn,
		startBattle,
		playerBoard,
		enemyBoard,
		playerShips,
		enemyShips,
		placeShip,
		attack,
		reset,
		randomizePlayerShips,
	} = useGameStore();

	const [horizontal, setHorizontal] = useState(true);
	const [selectedShip, setSelectedShip] = useState<number | null>(1);

	const handlePlaceShip = (x: number, y: number) => {
		if (phase === 'placement' && selectedShip) {
			placeShip(selectedShip, x, y, horizontal);
		}
	};

	return (
		<div className="flex flex-col items-center w-full animate-in fade-in duration-300">
			<div className="w-full flex justify-start mb-4">
				<button
					onClick={onBack}
					className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50"
				>
					← Back to Menu
				</button>
			</div>

			<h1 className="text-3xl font-bold mb-4 text-slate-800">
				Singleplayer
			</h1>

			<div className="mb-6 text-lg font-medium">
				{phase === 'placement' ? (
					'Setup Phase'
				) : turn === 'player' ? (
					<span className="text-emerald-600">Your Turn</span>
				) : (
					<span className="text-red-600">Enemy Turn</span>
				)}
			</div>

			{phase === 'placement' && (
				<PlayerControls
					horizontal={horizontal}
					setHorizontal={setHorizontal}
					selectedShip={selectedShip}
					setSelectedShip={setSelectedShip}
					ships={playerShips}
					onRandomize={randomizePlayerShips}
					onReset={reset}
				/>
			)}

			<div className="flex flex-col md:flex-row gap-12 items-start">
				<BoardContainer title="Your Board">
					<Grid
						board={playerBoard}
						ships={playerShips}
						phase={phase}
						horizontal={horizontal}
						selectedShip={selectedShip}
						onPlace={handlePlaceShip}
					/>
				</BoardContainer>

				<BoardContainer title="Enemy Board">
					<EnemyBoard
						board={enemyBoard}
						ships={enemyShips} // Singleplayer knows enemy ships, so we pass them for sunk styling
						phase={phase}
						onAttack={attack}
					/>
				</BoardContainer>
			</div>

			{phase === 'placement' && (
				<button
					onClick={startBattle}
					className="mt-8 px-6 py-2 rounded-lg bg-emerald-500 text-white text-lg font-bold hover:bg-emerald-600 transition-colors shadow-lg"
				>
					Start Battle
				</button>
			)}

			{(phase === 'won' || phase === 'lost') && (
				<EndScreen
					won={phase === 'won'}
					onReset={reset}
					onQuit={onBack}
				/>
			)}

			<SunkNotification />
		</div>
	);
};

export default SinglePlayerGame;
