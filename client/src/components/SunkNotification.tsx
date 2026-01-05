// components/SunkNotification.tsx
import { useEffect } from 'react';
import { useGameStore } from '../hooks/useGameStore';

const SunkNotification = () => {
	const lastSunkShip = useGameStore((s) => s.lastSunkShip);
	const clearSunkMessage = useGameStore((s) => s.clearSunkMessage);

	useEffect(() => {
		if (lastSunkShip) {
			const timer = setTimeout(() => {
				clearSunkMessage();
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [lastSunkShip, clearSunkMessage]);

	if (!lastSunkShip) return null;

	return (
		<div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg font-bold text-lg animate-bounce z-50">
			{lastSunkShip} sunk!!
		</div>
	);
};

export default SunkNotification;
