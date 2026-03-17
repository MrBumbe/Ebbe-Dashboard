import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { networkInterfaces } from 'os';
import { config } from './config';
import { loadSecrets } from './lib/secrets';
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
import shortlinkRoutes from './routes/shortlink';

// ── 1. Load JWT secrets (env vars or auto-generated in DB) ────────────────
// Must happen before any JWT operations (auth routes, etc.)
loadSecrets(config.databasePath);

const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// ── Health check — no auth required ───────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

// ── System info — LAN addresses for first-run wizard ──────────────────────
app.get('/api/v1/system/info', (_req, res) => {
  const ifaces = networkInterfaces();
  const addresses: string[] = [];
  for (const iface of Object.values(ifaces)) {
    if (!iface) continue;
    for (const addr of iface) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      // Skip Docker internal bridge addresses
      if (addr.address.startsWith('172.')) continue;
      addresses.push(addr.address);
    }
  }
  res.json({ data: { localAddresses: addresses } });
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',     authRoutes);
app.use('/api/v1/tasks',    tasksRoutes);
app.use('/api/v1/schedule', scheduleRoutes);
app.use('/api/v1/rewards',  rewardsRoutes);
app.use('/api/v1/mood',     moodRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/events',   eventsRoutes);
app.use('/api/v1/child',    childRoutes);
app.use('/api/v1/setup',    setupRoutes);
app.use('/api/v1/layouts',  layoutsRoutes);
app.use('/api/v1/users',    usersRoutes);
app.use('/api/v1/family',   familyRoutes);
app.use('/api/v1/children', childrenRoutes);
app.use('/c',              shortlinkRoutes);

// Module routes — mounted dynamically by loader
initModules(app);

// Global error handler — must be last
app.use(errorHandler);

// ── Init DB, then start server ─────────────────────────────────────────────
initDb();
initWebSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Ebbe backend running on port ${config.port}`);

  // Print first-run banner if setup has not been completed yet
  try {
    const { getDb } = require('./db') as typeof import('./db');
    const { families } = require('./db/schema') as typeof import('./db/schema');
    const existing = getDb().select().from(families).get();
    if (!existing) {
      console.log('\n====================================');
      console.log(' Ebbe — first-time setup required');
      console.log(' Open the app in your browser to get started');
      console.log('====================================\n');
    }
  } catch { /* ignore — DB might not have families table yet on very first run */ }
});

export default app;
