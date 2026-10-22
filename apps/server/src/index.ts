import config, { listen } from "@colyseus/tools";
import { GameRoom } from "./rooms/GameRoom.js";
import { config as serverConfig } from "./config.js";

export const appConfig = config({
  initializeGameServer: (gameServer) => {
    gameServer.define("game", GameRoom);
  },
  initializeExpress: (app) => {
    app.get("/healthz", (_req: any, res: any) => {
      res.json({
        ok: true,
        uptime: process.uptime(),
      });
    });
  },
});

export default appConfig;

// Automatically bind to PORT when started as main process
if (process.env.NODE_ENV !== "test") {
  listen(appConfig, serverConfig.PORT).then(() => {
    console.log(`[Mutator Party Server] Listening on port ${serverConfig.PORT}`);
  });
}
