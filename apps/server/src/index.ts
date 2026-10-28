// ─── src/index.ts ─────────────────────────────────────────────────────────────
// Mutator Party Authoritative Game Server Entry Point.
// ─────────────────────────────────────────────────────────────────────────────

import config, { listen } from "@colyseus/tools";
import { matchMaker } from "colyseus";
import { GameRoom } from "./rooms/GameRoom.js";
import { config as serverConfig } from "./config.js";
import { metricsRegistry, activeRoomsGauge } from "./obs/metrics.js";
import { logger } from "./obs/logger.js";
import { initSentry } from "./obs/sentry.js";

// Initialize Sentry error reporting if configured
initSentry();

let isDraining = false;

export function getDrainingStatus(): boolean {
  return isDraining;
}

export function setDrainingStatus(val: boolean): void {
  isDraining = val;
}

// Compatibility bridge: Colyseus 0.18 seat reservation is flat { name, roomId, sessionId },
// but colyseus.js expects response.room.name and response.room.roomId.
if (matchMaker?.controller?.invokeMethod) {
  const origInvoke = matchMaker.controller.invokeMethod.bind(matchMaker.controller);
  matchMaker.controller.invokeMethod = async function (method: any, roomName: any, clientOptions?: any, authOptions?: any) {
    const res: any = await origInvoke(method, roomName, clientOptions, authOptions);
    if (res && !res.room && res.name) {
      res.room = {
        name: res.name,
        roomId: res.roomId,
        processId: res.processId,
        publicAddress: res.publicAddress,
      };
    }
    return res;
  };
}

export const appConfig = config({
  initializeGameServer: (gameServer) => {
    gameServer.define("game", GameRoom).filterBy(["code"]);
  },
  initializeExpress: (app) => {
    // Health check endpoint (N9 / Step 3)
    app.get("/healthz", async (_req: any, res: any) => {
      const activeRooms = (await activeRoomsGauge.get()).values[0]?.value ?? 0;
      res.json({
        ok: true,
        draining: isDraining,
        rooms: activeRooms,
        uptime: process.uptime(),
      });
    });

    // Prometheus metrics endpoint (Step 7)
    app.get("/metrics", async (_req: any, res: any) => {
      res.set("Content-Type", metricsRegistry.contentType);
      res.end(await metricsRegistry.metrics());
    });
  },
  beforeListen: () => {
    // Handle graceful shutdown signals (SIGTERM, SIGINT)
    const handleShutdown = (signal: string) => {
      if (isDraining) return;
      isDraining = true;
      logger.info({ signal }, "Received shutdown signal, starting server drain...");

      // Allow running matches a graceful window to complete (e.g. 10s default)
      setTimeout(() => {
        logger.info("Graceful drain period expired. Exiting.");
        process.exit(0);
      }, 10_000).unref();
    };

    process.once("SIGTERM", () => handleShutdown("SIGTERM"));
    process.once("SIGINT", () => handleShutdown("SIGINT"));
  },
});

export default appConfig;

// Automatically bind to PORT when started as main process
if (process.env.NODE_ENV !== "test") {
  listen(appConfig, serverConfig.PORT).then(() => {
    logger.info(`[Mutator Party Server] Listening on port ${serverConfig.PORT}`);
  });
}
