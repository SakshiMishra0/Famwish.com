import { Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";
import { setIO } from "@/lib/socket";

export function attachSocketServer(server: HTTPServer) {
  const io = new IOServer(server, {
    cors: {
      origin: "*",
    },
  });

  setIO(io);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join_admin", () => {
      socket.join("admin");
      console.log("Admin joined");
    });

    socket.on("join_auction", (auctionId: string) => {
      socket.join(`auction:${auctionId}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  });

  return io;
}