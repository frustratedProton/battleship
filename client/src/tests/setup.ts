import { beforeEach } from "vitest";
import { useGameStore } from "../hooks/useGameStore";

beforeEach(() => {
	useGameStore.setState({
		playerBoard: {
			cells: Array.from({ length: 10 }, () => Array(10).fill('empty')),
		},
		enemyBoard: {
			cells: Array.from({ length: 10 }, () => Array(10).fill('empty')),
		},
		playerShips: [
			{
				id: 1,
				name: 'Carrier',
				size: 5,
				positions: [],
				placed: false,
				sunk: false,
			},
			{
				id: 2,
				name: 'Battleship',
				size: 4,
				positions: [],
				placed: false,
				sunk: false,
			},
			{
				id: 3,
				name: 'Cruiser',
				size: 3,
				positions: [],
				placed: false,
				sunk: false,
			},
			{
				id: 4,
				name: 'Submarine',
				size: 3,
				positions: [],
				placed: false,
				sunk: false,
			},
			{
				id: 5,
				name: 'Destroyer',
				size: 2,
				positions: [],
				placed: false,
				sunk: false,
			},
		],
		enemyShips: [],
		phase: 'placement',
		turn: 'player',
		enemyHits: [],
		enemyTargets: [],
		lastSunkShip: null,
	});
});
