interface EndScreenProps {
	won: boolean;
	onReset: () => void;
	onQuit: () => void;
}

const EndScreen = ({ won, onReset, onQuit }: EndScreenProps) => {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<div className="bg-white rounded-xl p-6 w-80 text-center shadow-2xl animate-scaleIn">
				<h2
					className={`text-2xl font-bold mb-2 ${
						won ? 'text-green-600' : 'text-red-600'
					}`}
				>
					{won ? 'Victory!' : 'Defeat'}
				</h2>

				<p className="mb-5 text-gray-600">
					{won
						? 'You sank all enemy ships!'
						: 'The enemy sank all of your ships.'}
				</p>

				<div className="flex justify-center gap-3">
					<button
						onClick={onReset}
						className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Restart
					</button>

					<button
						onClick={onQuit}
						className="px-4 py-2 border rounded hover:bg-gray-100"
					>
						Quit
					</button>
				</div>
			</div>
		</div>
	);
};

export default EndScreen;
