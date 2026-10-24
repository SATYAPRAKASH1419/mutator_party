import { describe, it, expect } from "vitest";
import { metricsRegistry, roomsCreatedCounter, inputsCounter } from "../src/obs/metrics.js";

describe("Prometheus Metrics Endpoint", () => {
  it("renders prometheus metrics string containing mutator party metrics", async () => {
    roomsCreatedCounter.inc();
    inputsCounter.inc(5);

    const text = await metricsRegistry.metrics();
    expect(text).toContain("mp_rooms_created_total");
    expect(text).toContain("mp_inputs_total");
    expect(metricsRegistry.contentType).toContain("text/plain");
  });
});

