import { useState } from 'react';
import SinglePlayerGame from './components/SinglePlayerGame';
import MultiPlayerGame from './components/MultiPlayerGame';

type AppMode = 'menu' | 'single' | 'multi';

const App = () => {
	const [mode, setMode] = useState<AppMode>('menu');

	return (
		<main className="min-h-screen p-6 bg-slate-50 flex flex-col items-center justify-center font-sans">
			{mode === 'menu' && (
				<div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
					<h1 className="text-5xl font-extrabold mb-2 text-slate-800 tracking-tight">
						BATTLESHIP
					</h1>
					<p className="text-slate-500 mb-10 text-lg">
						Select a game mode to begin
					</p>

					<div className="flex flex-col gap-6 w-full max-w-sm">
						<button
							onClick={() => setMode('single')}
							className="group relative w-full py-6 px-6 bg-white border-2 border-slate-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-200 text-left"
						>
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600">
										Singleplayer
									</h3>
									<p className="text-slate-500 text-sm mt-1">
										Play against the computer
									</p>
								</div>
								<span className="text-3xl">🤖</span>
							</div>
						</button>

						<button
							onClick={() => setMode('multi')}
							className="group relative w-full py-6 px-6 bg-white border-2 border-slate-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all duration-200 text-left"
						>
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600">
										Multiplayer
									</h3>
									<p className="text-slate-500 text-sm mt-1">
										Play online with a friend
									</p>
								</div>
								<span className="text-3xl">🌍</span>
							</div>
						</button>
					</div>
				</div>
			)}

			{mode === 'single' && (
				<SinglePlayerGame onBack={() => setMode('menu')} />
			)}

			{mode === 'multi' && (
				<MultiPlayerGame onBack={() => setMode('menu')} />
			)}
		</main>
	);
};

export default App;
