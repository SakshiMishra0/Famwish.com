import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { redis } from "@/lib/redis";
import { getSocketServer, getRoomCount } from "@/lib/socket";

export async function GET() {
  await requireAdmin();

  const socket = getSocketServer();

  const socketRooms = socket
    ? Array.from(socket.sockets.adapter.rooms.keys())
    : [];

  const auctionRooms = socketRooms.filter((room) =>
    room.startsWith("auction:")
  ).length;

  let redisStatus = {
    connected: false,
    status: "disconnected",
    error: null as string | null,
  };

  try {
    const pong = await redis.ping();

    redisStatus = {
      connected: pong === "PONG",
      status: redis.status,
      error: null,
    };
  } catch (error) {
    redisStatus = {
      connected: false,
      status: "error",
      error:
        error instanceof Error
          ? error.message
          : "Unknown Redis error",
    };
  }

  return NextResponse.json({
    redis: redisStatus,

    socket: {
      initialized: Boolean(socket),
      rooms: socketRooms,
      auctionRoomCount: auctionRooms,
      adminRoomCount: getRoomCount("admin"),
    },
  });
}