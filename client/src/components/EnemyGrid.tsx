import type { Board, Ship } from '../types/game';

interface EnemyBoardProps {
	board: Board;
	ships?: Ship[];
	phase: string;
	onAttack: (x: number, y: number) => void;
}

const EnemyBoard = ({
	board,
	ships = [],
	phase,
	onAttack,
}: EnemyBoardProps) => {
	const isCellSunk = (x: number, y: number): boolean => {
		return ships.some(
			(s) => s.sunk && s.positions.some((p) => p.x === x && p.y === y)
		);
	};

	return (
		<div className="grid grid-cols-10 gap-0.5">
			{board.cells.flatMap((row, y) =>
				row.map((cell, x) => {
					const sunk = isCellSunk(x, y);

					const bg =
						cell === 'hit' && sunk
							? 'bg-red-800' // Sunk = darker red
							: cell === 'hit'
							? 'bg-red-500'
							: cell === 'miss'
							? 'bg-gray-400'
							: 'bg-white';

					return (
						<div
							key={`${x}-${y}`}
							className={`
                w-10 h-10
                border border-gray-500
                ${bg}
                ${sunk ? 'border-red-900 border-2' : ''}
                ${phase === 'attack' ? 'cursor-pointer' : 'cursor-not-allowed'}
              `}
							onClick={() => phase === 'attack' && onAttack(x, y)}
						/>
					);
				})
			)}
		</div>
	);
};

export default EnemyBoard;
