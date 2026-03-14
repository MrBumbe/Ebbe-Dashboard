import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { eq } from 'drizzle-orm';
import { verifyAccessToken } from '../lib/jwt';
import { getDb } from '../db';
import { families } from '../db/schema';

interface EbbeClient {
  ws: WebSocket;
  familyId: string;
  type: 'child' | 'parent';
}

const clients = new Set<EbbeClient>();

export function initWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url ?? '/', `http://localhost`);
    const childToken = url.searchParams.get('token');
    const authToken = url.searchParams.get('auth');

    let client: EbbeClient | null = null;

    if (childToken) {
      // Child connection — authenticated by child token
      const family = getDb().select().from(families).where(eq(families.childToken, childToken)).get();
      if (family) {
        client = { ws, familyId: family.id, type: 'child' };
      }
    } else if (authToken) {
      // Parent connection — authenticated by JWT
      const payload = verifyAccessToken(authToken);
      if (payload) {
        client = { ws, familyId: payload.familyId, type: 'parent' };
      }
    }

    if (!client) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    clients.add(client);

    ws.on('message', (data) => {
      if (client?.type !== 'parent') return;
      try {
        const msg = JSON.parse(data.toString()) as { type: string; payload?: unknown };
        handleParentMessage(client.familyId, msg);
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      if (client) clients.delete(client);
    });
  });

  console.log('WebSocket server ready');
}

function handleParentMessage(familyId: string, msg: { type: string; payload?: unknown }) {
  switch (msg.type) {
    case 'TRIGGER_TIMER':
      broadcastToFamily(familyId, 'child', { type: 'TIMER_START', payload: msg.payload });
      break;
    case 'CANCEL_TIMER':
      broadcastToFamily(familyId, 'child', { type: 'TIMER_CANCEL' });
      break;
  }
}

export function broadcastToFamily(
  familyId: string,
  target: 'child' | 'parent' | 'all',
  message: object,
) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.familyId !== familyId) continue;
    if (target !== 'all' && client.type !== target) continue;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}
