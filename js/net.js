// Peer-to-peer connection between two players (PeerJS: the browsers talk directly, the PeerJS cloud
// server only introduces them). Messages are small JSON objects with a type in `t`.
import { NET } from './config.js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no look-alike letters or digits
const peerId = code => 'fibishot-' + code;
const makeCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

let peer = null, conn = null, pingTimer = null, lastRecv = 0;
let onMessage = null, onClose = null, onConnect = null;

function newPeer(id) {
  return new Promise((resolve, reject) => {
    if (!window.Peer) { reject(new Error('peerjs-missing')); return; }
    const p = new window.Peer(id, { debug: 0, config: { iceServers: NET.iceServers } });
    p.on('open', () => resolve(p));
    p.on('error', reject);
  });
}

// Wires up a connection that is open: messages, ping and loss detection
function attach(c) {
  conn = c;
  lastRecv = Date.now();
  c.on('data', msg => { lastRecv = Date.now(); if (msg.t !== 'ping') onMessage?.(msg); });
  c.on('close', () => lost(c));
  c.on('error', () => lost(c));
  pingTimer = setInterval(() => {
    net.send({ t: 'ping' });
    if (Date.now() - lastRecv > NET.timeoutMs) lost(c);
  }, NET.pingMs);
  onConnect?.();
}

function lost(c) {
  if (c !== conn) return;   // already closed on purpose
  net.close();
  onClose?.();
}

export const net = {
  role: null,               // 'host' | 'guest'
  get connected() { return !!conn?.open; },

  setHandler(fn) { onMessage = fn; },
  setCloseHandler(fn) { onClose = fn; },
  setConnectHandler(fn) { onConnect = fn; },

  // Creates a room and returns its code. The friend connects later (see setConnectHandler).
  async host() {
    net.close();
    for (let i = 0; i < 5; i++) {
      const code = makeCode();
      try { peer = await newPeer(peerId(code)); } catch (e) { if (e.type === 'unavailable-id') continue; throw e; }
      peer.on('connection', c => {
        if (conn) { c.on('open', () => c.close()); return; }   // room is full
        c.on('open', () => attach(c));
      });
      net.role = 'host';
      return code;
    }
    throw new Error('no-room-code');
  },

  async join(code) {
    net.close();
    peer = await newPeer();
    await new Promise((resolve, reject) => {
      const c = peer.connect(peerId(code.toUpperCase()), { reliable: true });
      const timer = setTimeout(() => reject(new Error('timeout')), NET.joinTimeoutMs);
      const fail = e => { clearTimeout(timer); reject(e); };
      c.on('open', () => { clearTimeout(timer); attach(c); resolve(); });
      c.on('error', fail);
      peer.on('error', fail);
    });
    net.role = 'guest';
  },

  send(msg) { if (conn?.open) conn.send(msg); },

  close() {
    clearInterval(pingTimer);
    const c = conn, p = peer;
    conn = peer = null;
    net.role = null;
    try { c?.close(); } catch { /* already closed */ }
    try { p?.destroy(); } catch { /* already closed */ }
  },
};
