import { useState } from 'react';
import type { Board, Ship } from '../types/game'; 

interface GridProps {
	board: Board;
	ships: Ship[]; 
	phase: string;
	horizontal: boolean;
	selectedShip: number | null;
	onPlace: (x: number, y: number) => void;
}

const Grid = ({
	board,
	ships,
	phase,
	horizontal,
	selectedShip,
	onPlace,
}: GridProps) => {
	const [hovered, setHovered] = useState<{ x: number; y: number } | null>(
		null
	);

	const allPlaced = ships.every((s) => s.placed);
	const ship = ships.find((s) => s.id === selectedShip);

	const isCellSunk = (x: number, y: number): boolean => {
		return ships.some(
			(s) => s.sunk && s.positions.some((p) => p.x === x && p.y === y)
		);
	};

	return (
		<div className="grid grid-cols-10 gap-0.5 w-max">
			{board.cells.flatMap((row, y) =>
				row.map((cell, x) => {
					const isHover =
						phase === 'placement' &&
						!allPlaced &&
						hovered &&
						ship &&
						!ship.placed &&
						Array.from({ length: ship.size }).some((_, i) =>
							horizontal
								? hovered.x + i === x && hovered.y === y
								: hovered.x === x && hovered.y + i === y
						);

					const sunk = isCellSunk(x, y);

					const base =
						cell === 'hit' && sunk
							? 'bg-red-800' 
							: cell === 'hit'
							? 'bg-red-500'
							: cell === 'miss'
							? 'bg-gray-400'
							: cell === 'ship' && sunk
							? 'bg-red-800' 
							: cell === 'ship'
							? 'bg-green-500'
							: 'bg-white';

					return (
						<div
							key={`${x}-${y}`}
							className={`
                w-10 h-10
                border border-gray-500
                ${base}
                ${isHover ? 'bg-blue-300' : ''}
                ${sunk ? 'border-red-900' : ''}
              `}
							onMouseEnter={() =>
								phase === 'placement' &&
								!allPlaced &&
								ship &&
								!ship.placed &&
								setHovered({ x, y })
							}
							onMouseLeave={() =>
								phase === 'placement' && setHovered(null)
							}
							onClick={() =>
								phase === 'placement' &&
								!allPlaced &&
								selectedShip &&
								onPlace(x, y)
							}
						/>
					);
				})
			)}
		</div>
	);
};

export default Grid;
