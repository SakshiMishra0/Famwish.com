import { createServer } from "http";
import next from "next";
import { attachSocketServer } from "./src/sockets/server";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT || 3000);

const app = next({
  dev,
  hostname,
  port,
});

const handle = app.getRequestHandler();

async function bootstrap() {
  await app.prepare();

  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  attachSocketServer(httpServer);

  httpServer.listen(port, hostname, () => {
    console.log(`FamWish running on http://${hostname}:${port}`);
  });
}

bootstrap().catch(console.error);