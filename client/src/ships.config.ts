export interface ShipConfig {
    id: number;
    name: string;
    size: number;
}

export const SHIP_DEFINITIONS: ShipConfig[] = [
	{ id: 1, name: 'Carrier', size: 5 },
	{ id: 2, name: 'Battleship', size: 4 },
	{ id: 3, name: 'Cruiser', size: 3 },
	{ id: 4, name: 'Submarine', size: 3 },
	{ id: 5, name: 'Destroyer', size: 2 },
];