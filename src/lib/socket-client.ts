import { io, Socket } from "socket.io-client";

declare global {
  interface Window {
    __famwishSocketClient?: Socket;
  }
}

export async function getSocketClient(): Promise<Socket> {
  if (typeof window === "undefined") {
    throw new Error("Socket client can only run in the browser.");
  }

  if (window.__famwishSocketClient) {
    return window.__famwishSocketClient;
  }

  const socket = io(window.location.origin, {
    autoConnect: false,
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    timeout: 20000,
  });

  window.__famwishSocketClient = socket;
  return socket;
}

export async function joinAuctionRoom(auctionId: string) {
  const socket = await getSocketClient();
  if (!socket.connected) {
    socket.connect();
  }
  socket.emit("join_room", { room: `auction:${auctionId}` });
  return socket;
}

export async function leaveAuctionRoom(auctionId: string) {
  const socket = await getSocketClient();
  socket.emit("leave_room", { room: `auction:${auctionId}` });
}

export async function joinAdminRoom() {
  const socket = await getSocketClient();
  if (!socket.connected) {
    socket.connect();
  }
  socket.emit("join_admin");
  return socket;
}

export async function disconnectSocket() {
  if (typeof window === "undefined") return;
  const socket = window.__famwishSocketClient;
  if (socket) {
    socket.disconnect();
    window.__famwishSocketClient = undefined;
  }
}
