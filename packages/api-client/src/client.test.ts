import { describe, expect, it, vi } from "vitest";

import { type ApiClientConfig, ApiError, createApiClient, TENANT_HEADER } from "./index";

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function setup(overrides: Partial<ApiClientConfig> = {}) {
  const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse(200, { ok: true })));
  const client = createApiClient({
    baseUrl: "https://api.test/v1/",
    getAccessToken: () => "token-123",
    getClientId: () => "tenant_acme",
    fetch: fetchMock,
    ...overrides,
  });
  return { client, fetchMock };
}

describe("createApiClient", () => {
  it("sends tenant and auth headers to the resolved URL", async () => {
    const { client, fetchMock } = setup();

    await client.get("/bookings", { query: { status: ["requested", "accepted"], page: 2 } });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.test/v1/bookings?status=requested&status=accepted&page=2");
    const headers = new Headers(init?.headers);
    expect(headers.get(TENANT_HEADER)).toBe("tenant_acme");
    expect(headers.get("Authorization")).toBe("Bearer token-123");
  });

  it("refuses tenant-scoped requests when no tenant is selected", async () => {
    const { client, fetchMock } = setup({ getClientId: () => null });

    await expect(client.get("/bookings")).rejects.toMatchObject({ code: "TENANT_REQUIRED" });
    expect(fetchMock).not.toHaveBeenCalled();

    await expect(client.post("/auth/login", {}, { tenant: false })).resolves.toEqual({ ok: true });
  });

  it("normalises NestJS validation errors and notifies on 401", async () => {
    const onUnauthorized = vi.fn();
    const { client, fetchMock } = setup({ onUnauthorized });

    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        400,
        { statusCode: 400, message: ["fare must be an integer"], error: "Bad Request" },
        { "X-Request-Id": "req_42" },
      ),
    );
    const error = await client.post("/bookings", { fare: 1.5 }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "BAD_REQUEST",
      message: "fare must be an integer",
      requestId: "req_42",
      isRetryable: false,
    });

    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { code: "TOKEN_EXPIRED", message: "Expired" }),
    );
    await expect(client.get("/me")).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("maps network failures to a retryable NETWORK_ERROR", async () => {
    const { client, fetchMock } = setup();
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(client.get("/bookings")).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
      isRetryable: true,
    });
  });

  it("wraps schema failures as INVALID_RESPONSE", async () => {
    const { client } = setup();
    const parse = (): never => {
      throw new Error("bad shape");
    };

    await expect(client.get("/bookings/1", { parse })).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });
});
