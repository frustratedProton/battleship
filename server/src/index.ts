import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameManager } from './game/GameManager';
import { setupSocketHandlers } from './socket/handlers';

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
	cors: {
		origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
		methods: ['GET', 'POST'],
		credentials: true,
	},
	pingTimeout: 60000,
	pingInterval: 25000,
});

const gameManager = new GameManager();

app.get('/', (req, res) => {
	res.json({
		status: 'ok',
		message: 'Battleship server running',
		...gameManager.getStats(),
	});
});

app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
	setupSocketHandlers(io, socket, gameManager);
});

httpServer.listen(PORT, () => {
	console.log(`Battleship server running on port ${PORT}`);
	console.log(`Accepting connections from: ${CLIENT_URL}`);
});

process.on('SIGTERM', () => {
	console.log('SIGTERM received, shutting down...');
	httpServer.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});

process.on('SIGINT', () => {
	console.log('SIGINT received, shutting down...');
	httpServer.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});
