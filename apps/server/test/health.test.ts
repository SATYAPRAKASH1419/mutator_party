import { describe, expect, it } from "vitest";
import appConfig from "../src/index.js";

describe("Server Entry Point & Health Config", () => {
  it("exports a valid colyseus appConfig", () => {
    expect(appConfig).toBeDefined();
    expect(typeof appConfig.initializeGameServer).toBe("function");
    expect(typeof appConfig.initializeExpress).toBe("function");
  });

  it("registers /healthz route on express app", () => {
    let healthRouteRegistered = false;
    const dummyApp: any = {
      get: (path: string, _handler: any) => {
        if (path === "/healthz") {
          healthRouteRegistered = true;
        }
      },
    };

    appConfig.initializeExpress!(dummyApp);
    expect(healthRouteRegistered).toBe(true);
  });
});

