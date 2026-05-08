import type { Server as IOServer } from "socket.io";
import { trackSocketEvent, trackAuctionActivity } from "@/lib/observability";

declare global {
  // eslint-disable-next-line no-var
  var __famwishSocketServer:
    | IOServer
    | undefined;
}

export function setIO(io: IOServer) {
  global.__famwishSocketServer = io;
}

export function getIO(): IOServer | undefined {
  return global.__famwishSocketServer;
}

export function getSocketServer(): IOServer | null {
  return getIO() ?? null;
}

export function initSocketServer(server: any): IOServer {
  const existing = getIO();
  if (existing) {
    return existing;
  }

  const io = new IOServer(server, {
    path: "/api/socket",
    cors: {
      origin: true,
      methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 60000,
    transports: ["websocket"],
    maxHttpBufferSize: 1_000_000,
  });

  io.on("connection", (socket) => {
    trackSocketEvent("connection", {
      socketId: socket.id,
      rooms: Array.from(socket.rooms),
    });

    socket.on("join_room", ({ room }: { room: string }) => {
      socket.join(room);
      trackSocketEvent("join_room", {
        socketId: socket.id,
        room,
      });
      if (room.startsWith("auction:")) {
        io.to(room).emit("bidder_joined", {
          auctionRoom: room,
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on("leave_room", ({ room }: { room: string }) => {
      socket.leave(room);
      trackSocketEvent("leave_room", {
        socketId: socket.id,
        room,
      });
      if (room.startsWith("auction:")) {
        io.to(room).emit("bidder_left", {
          auctionRoom: room,
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on("join_admin", () => {
      socket.join("admin");
      trackSocketEvent("join_admin", {
        socketId: socket.id,
      });
    });

    socket.on("disconnect", (reason) => {
      trackSocketEvent("disconnect", {
        socketId: socket.id,
        reason,
      });
    });

    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  setIO(io);
  return io;
}

export function getRoomCount(room: string): number {
  const io = getSocketServer();
  if (!io) return 0;
  const clients = io.sockets.adapter.rooms.get(room);
  return clients ? clients.size : 0;
}

export function emitAuctionEvent(
  auctionId: string,
  event: string,
  payload: unknown
) {
  const io = getSocketServer();
  if (!io) {
    trackSocketEvent("emit_failed", {
      auctionId,
      event,
      reason: "no-server",
    });
    return;
  }

  const room = `auction:${auctionId}`;
  io.to(room).emit(event, payload);
  io.to("admin").emit("admin_event", {
    event,
    auctionId,
    payload,
    timestamp: new Date().toISOString(),
  });
  trackAuctionActivity(auctionId, { event, payload });
}
