import { describe, expect, it } from "vitest";
import appConfig from "../src/index.js";

describe("Server Entry Point & Health Config", () => {
  it("exports a valid colyseus appConfig", () => {
    expect(appConfig).toBeDefined();
    expect(typeof appConfig.initializeGameServer).toBe("function");
    expect(typeof appConfig.initializeExpress).toBe("function");
  });

  it("registers /healthz route on express app and returns status including rooms", async () => {
    let handler: any = null;
    const dummyApp: any = {
      get: (path: string, h: any) => {
        if (path === "/healthz") {
          handler = h;
        }
      },
    };

    appConfig.initializeExpress!(dummyApp);
    expect(handler).toBeDefined();

    let jsonResponse: any = null;
    const dummyRes = {
      json: (data: any) => {
        jsonResponse = data;
      },
    };

    await handler({}, dummyRes);
    expect(jsonResponse).toHaveProperty("ok", true);
    expect(jsonResponse).toHaveProperty("rooms");
    expect(jsonResponse).toHaveProperty("uptime");
  });
});

