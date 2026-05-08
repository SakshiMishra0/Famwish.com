import type { NextApiRequest, NextApiResponse } from "next";
import { initSocketServer } from "@/lib/socket";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket.server.io) {
    const io = initSocketServer(res.socket.server);
    (res.socket.server as any).io = io;
    console.log("[FamWish] Socket.IO server initialized.");
  }

  res.status(200).end();
}
