import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { config } from './config';
import { initDb } from './db';
import { initWebSocket } from './websocket';
import { errorHandler } from './middleware/errors';
import { initModules } from './modules/core/loader';
import authRoutes from './routes/auth';
import tasksRoutes from './routes/tasks';
import scheduleRoutes from './routes/schedule';
import rewardsRoutes from './routes/rewards';
import moodRoutes from './routes/mood';
import settingsRoutes from './routes/settings';
import eventsRoutes from './routes/events';
import childRoutes from './routes/child';
import setupRoutes from './routes/setup';
import layoutsRoutes from './routes/layouts';
import usersRoutes from './routes/users';
import familyRoutes from './routes/family';
import childrenRoutes from './routes/children';

const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Health check — no auth required
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/schedule', scheduleRoutes);
app.use('/api/v1/rewards', rewardsRoutes);
app.use('/api/v1/mood', moodRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/events', eventsRoutes);
app.use('/api/v1/child', childRoutes);
app.use('/api/v1/setup', setupRoutes);
app.use('/api/v1/layouts', layoutsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/family', familyRoutes);
app.use('/api/v1/children', childrenRoutes);

// Module routes — mounted dynamically by loader
initModules(app);

// Global error handler — must be last
app.use(errorHandler);

// Init DB, then start server
initDb();
initWebSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Ebbe backend running on port ${config.port}`);
});

export default app;
