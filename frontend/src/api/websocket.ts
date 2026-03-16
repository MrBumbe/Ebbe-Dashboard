// WebSocket client singleton for the child view.
// Connects with ?token=<childToken> and fires callbacks on events.

export type WsMessage =
  | { type: 'TIMER_START'; payload: { seconds: number; label: string } }
  | { type: 'TIMER_CANCEL' }
  | { type: 'TASK_UPDATED'; payload: { taskId: string; action: string } }
  | { type: 'STARS_UPDATED'; payload: { balance: number } }
  | { type: 'LAYOUT_UPDATED' }
  | { type: 'REWARD_REQUESTED'; payload: { requestId: string; rewardId: string; rewardTitle: string } }
  | { type: 'REQUEST_RESOLVED'; payload: { requestId: string; action: string } };

type MessageHandler = (msg: WsMessage) => void;

let ws: WebSocket | null = null;
let handler: MessageHandler | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function connectChildWs(token: string, onMessage: MessageHandler): () => void {
  handler = onMessage;
  connect(token);

  return () => {
    handler = null;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) { ws.onclose = null; ws.close(); ws = null; }
  };
}

function connect(token: string) {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${protocol}://${location.host}/ws?token=${encodeURIComponent(token)}`);

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data as string) as WsMessage;
      handler?.(msg);
    } catch { /* ignore malformed */ }
  };

  ws.onclose = () => {
    // Reconnect after 3s if handler is still active
    if (handler) {
      reconnectTimer = setTimeout(() => connect(token), 3000);
    }
  };
}

// Parent WebSocket — sends timer commands
export function connectParentWs(authToken: string): WebSocket {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const socket = new WebSocket(`${protocol}://${location.host}/ws?auth=${encodeURIComponent(authToken)}`);
  return socket;
}
