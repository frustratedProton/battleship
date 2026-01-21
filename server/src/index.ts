import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameManager } from './game/GameManager';
import { setupSocketHandlers } from './socket/handlers';

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
	CLIENT_URL,
	'http://localhost:5173',
	'http://localhost:3000',
];

app.use(
	cors({
		origin: allowedOrigins,
		credentials: true,
	}),
);

app.use(express.json());

const io = new Server(httpServer, {
	cors: {
		origin: allowedOrigins,
		methods: ['GET', 'POST'],
		credentials: true,
	},
	// needed for render's proxy handling
	transports: ['websocket', 'polling'],
	allowEIO3: true,
	pingTimeout: 60000,
	pingInterval: 25000,
});

const gameManager = new GameManager();

app.get('/', (req, res) => {
	res.json({
		status: 'ok',
		message: 'Battleship server running',
		environment: NODE_ENV,
		...gameManager.getStats(),
	});
});

app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'ok',
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
	});
});

io.on('connection', (socket) => {
	console.log(`Client connected: ${socket.id}`);

	setupSocketHandlers(io, socket, gameManager);

	socket.on('disconnect', (reason) => {
		console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
	});
});

httpServer.listen(PORT, () => {
	console.log(`════════════════════════════════════════`);
	console.log(`  Battleship server running on port ${PORT}`);
	console.log(`  Environment: ${NODE_ENV}`);
	console.log(`  Accepting connections from: ${CLIENT_URL}`);
	console.log(`════════════════════════════════════════`);
});

const shutdown = (signal: string) => {
	console.log(`${signal} received, shutting down gracefully...`);

	io.close(() => {
		console.log('Socket.io server closed');
	});

	httpServer.close(() => {
		console.log('HTTP server closed');
		process.exit(0);
	});

	// Force exit after 10 seconds
	setTimeout(() => {
		console.log('Forcing shutdown...');
		process.exit(1);
	}, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
