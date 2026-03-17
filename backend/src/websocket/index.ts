import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { eq } from 'drizzle-orm';
import { verifyAccessToken } from '../lib/jwt';
import { getDb } from '../db';
import { families, children } from '../db/schema';

interface EbbeClient {
  ws: WebSocket;
  familyId: string;
  type: 'child' | 'parent';
  childId: string | null; // null = legacy family-level token; set = per-child token
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
      // Mirror childAuth middleware: check children.childToken first, then families.childToken
      const db = getDb();
      const child = db.select().from(children).where(eq(children.childToken, childToken)).get();
      if (child) {
        client = { ws, familyId: child.familyId, type: 'child', childId: child.id };
      } else {
        const family = db.select().from(families).where(eq(families.childToken, childToken)).get();
        if (family) {
          client = { ws, familyId: family.id, type: 'child', childId: null };
        }
      }
    } else if (authToken) {
      // Parent connection — authenticated by JWT
      const payload = verifyAccessToken(authToken);
      if (payload) {
        client = { ws, familyId: payload.familyId, type: 'parent', childId: null };
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
    case 'TRIGGER_TIMER': {
      // payload may include childId: string (specific child) | 'all' | null (all children)
      const payload = msg.payload as { seconds: number; label: string; childId?: string | null };
      const { childId: targetChildId, ...timerPayload } = payload;
      const target = (!targetChildId || targetChildId === 'all') ? undefined : targetChildId;
      broadcastToFamily(familyId, 'child', { type: 'TIMER_START', payload: timerPayload }, target);
      break;
    }
    case 'CANCEL_TIMER': {
      // payload may include childId to cancel a specific child's timer
      const payload = msg.payload as { childId?: string | null } | undefined;
      const targetChildId = (payload as { childId?: string | null } | undefined)?.childId;
      const target = (!targetChildId || targetChildId === 'all') ? undefined : targetChildId;
      broadcastToFamily(familyId, 'child', { type: 'TIMER_CANCEL' }, target);
      break;
    }
  }
}

/**
 * Broadcast a message to all matching clients in a family.
 * @param familyId  - only clients in this family receive the message
 * @param target    - 'child' | 'parent' | 'all' — filters by connection type
 * @param message   - the JSON-serialisable message object
 * @param childId   - optional; when set, only child connections with this childId receive it.
 *                    Pass undefined (or omit) to target all children in the family.
 */
export function broadcastToFamily(
  familyId: string,
  target: 'child' | 'parent' | 'all',
  message: object,
  childId?: string,
) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.familyId !== familyId) continue;
    if (target !== 'all' && client.type !== target) continue;
    // If a specific childId is requested, skip clients that don't match
    if (childId !== undefined && client.type === 'child' && client.childId !== childId) continue;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}
