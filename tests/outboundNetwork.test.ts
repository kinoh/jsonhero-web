import {
  assertOutboundNetworkAllowed,
  isOutboundNetworkDisabled,
} from "../app/environment.server";
import { getStarCount } from "../app/services/github.server";

describe("outbound network guard", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete (globalThis as Record<string, unknown>).JSONHERO_DISABLE_OUTBOUND_NETWORK;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("reads the disable flag from the environment", () => {
    process.env.JSONHERO_DISABLE_OUTBOUND_NETWORK = "1";

    expect(isOutboundNetworkDisabled()).toBe(true);
  });

  test("allows loopback requests while outbound network is disabled", () => {
    process.env.JSONHERO_DISABLE_OUTBOUND_NETWORK = "1";

    expect(() =>
      assertOutboundNetworkAllowed("http://127.0.0.1:3000/health")
    ).not.toThrow();
    expect(() =>
      assertOutboundNetworkAllowed("https://localhost/internal")
    ).not.toThrow();
  });

  test("rejects external requests while outbound network is disabled", () => {
    process.env.JSONHERO_DISABLE_OUTBOUND_NETWORK = "1";

    expect(() =>
      assertOutboundNetworkAllowed("https://example.com/data.json")
    ).toThrow("Outbound network requests are disabled");
  });
});

describe("getStarCount", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      JSONHERO_DISABLE_OUTBOUND_NETWORK: "1",
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  test("returns undefined without calling fetch when outbound network is disabled", async () => {
    await expect(getStarCount()).resolves.toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
