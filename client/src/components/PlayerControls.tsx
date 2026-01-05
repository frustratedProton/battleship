import type { Ship } from '../types/game';

interface PlayerControlsProps {
	horizontal: boolean;
	setHorizontal: (v: boolean) => void;
	selectedShip: number | null;
	setSelectedShip: (id: number) => void;
	ships: Ship[];
	onRandomize: () => void;
	onReset: () => void;
}

const PlayerControls = ({
	horizontal,
	setHorizontal,
	selectedShip,
	setSelectedShip,
	ships,
	onRandomize,
	onReset,
}: PlayerControlsProps) => {
	const allPlaced = ships.every((s) => s.placed);

	return (
		<div className="mb-6 flex flex-col gap-3">
			<div className="flex flex-wrap gap-2">
				{ships.map((s) => (
					<button
						key={s.id}
						disabled={s.placed}
						onClick={() => setSelectedShip(s.id)}
						className={`
              px-3 py-1 rounded text-sm
              ${s.placed ? 'bg-gray-400 cursor-not-allowed' : ''}
              ${
					selectedShip === s.id && !s.placed
						? 'bg-blue-500 text-white'
						: ''
				}
              ${
					!s.placed && selectedShip !== s.id
						? 'bg-gray-200 hover:bg-gray-300'
						: ''
				}
            `}
					>
						{s.name}
					</button>
				))}
			</div>

			<div className="flex gap-3">
				<button
					onClick={() => setHorizontal(!horizontal)}
					className="px-3 py-1 rounded bg-indigo-500 text-white hover:bg-indigo-600"
				>
					Rotate ({horizontal ? '→' : '↓'})
				</button>

				<button
					onClick={onRandomize}
					disabled={allPlaced}
					className={`
            px-3 py-1 rounded
            ${
				allPlaced
					? 'bg-gray-400 cursor-not-allowed'
					: 'bg-slate-700 text-white hover:bg-slate-800'
			}
          `}
				>
					Random placement
				</button>

				<button
					onClick={onReset}
					className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
				>
					Clear
				</button>
			</div>
		</div>
	);
};

export default PlayerControls;
