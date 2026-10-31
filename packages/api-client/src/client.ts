import { ApiError, normalizeErrorBody } from "./errors";

export const TENANT_HEADER = "X-Client-Id";
export const REQUEST_ID_HEADER = "X-Request-Id";

type MaybePromise<T> = T | Promise<T>;

export interface ApiClientConfig {
  /** e.g. `https://api.truckbuck.in/v1`. Trailing slashes are ignored. */
  baseUrl: string;
  /** Returns the current access token, or null when signed out. */
  getAccessToken?: () => MaybePromise<string | null>;
  /** Returns the active tenant id, or null when none is selected. */
  getClientId?: () => string | null;
  /** Called on any 401 — typically clears the session and redirects to login. */
  onUnauthorized?: (error: ApiError) => void;
  /** Per-request timeout. Default 15s. */
  timeoutMs?: number;
  /** Injected for tests or non-browser runtimes. Defaults to global fetch. */
  fetch?: typeof fetch;
}

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions<T> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue | readonly QueryValue[]>;
  /** Serialised as JSON. */
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /**
   * Every resource is tenant-scoped, so requests fail fast with
   * `TENANT_REQUIRED` when no clientId is available. Set `false` only for
   * endpoints that are genuinely tenant-agnostic (e.g. login).
   */
  tenant?: boolean;
  /** Attach the bearer token. Default true. */
  auth?: boolean;
  /** Validates/transforms the JSON body, e.g. `BookingSchema.parse`. */
  parse?: (data: unknown) => T;
}

type MethodOptions<T> = Omit<RequestOptions<T>, "method" | "body">;

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient(config: ApiClientConfig) {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const timeoutMs = config.timeoutMs ?? 15_000;
  const doFetch = config.fetch ?? globalThis.fetch.bind(globalThis);

  function buildUrl(path: string, query: RequestOptions<unknown>["query"]): string {
    const url = new URL(`${baseUrl}/${path.replace(/^\/+/, "")}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      const values: readonly QueryValue[] = Array.isArray(value) ? value : [value];
      for (const item of values) {
        if (item !== undefined && item !== null) url.searchParams.append(key, String(item));
      }
    }
    return url.toString();
  }

  async function request<T = unknown>(path: string, options: RequestOptions<T> = {}): Promise<T> {
    const headers = new Headers({ Accept: "application/json", ...options.headers });

    if (options.tenant ?? true) {
      const clientId = config.getClientId?.() ?? null;
      if (!clientId) {
        throw new ApiError({
          status: 0,
          code: "TENANT_REQUIRED",
          message: `No tenant selected for ${path}. Pass { tenant: false } for tenant-agnostic endpoints.`,
        });
      }
      headers.set(TENANT_HEADER, clientId);
    }

    if (options.auth ?? true) {
      const token = await config.getAccessToken?.();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    let body: string | undefined;
    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }

    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal;

    let response: Response;
    try {
      response = await doFetch(buildUrl(path, options.query), {
        method: options.method ?? "GET",
        headers,
        signal,
        ...(body === undefined ? {} : { body }),
      });
    } catch (cause) {
      if (timeoutSignal.aborted) {
        throw new ApiError({ status: 0, code: "TIMEOUT", message: "Request timed out", cause });
      }
      if (options.signal?.aborted) {
        throw new ApiError({ status: 0, code: "ABORTED", message: "Request aborted", cause });
      }
      throw new ApiError({
        status: 0,
        code: "NETWORK_ERROR",
        message: "Network error — check your connection",
        cause,
      });
    }

    const requestId = response.headers.get(REQUEST_ID_HEADER);
    const data = await readBody(response);

    if (!response.ok) {
      const error = normalizeErrorBody(response.status, data, requestId);
      if (response.status === 401) config.onUnauthorized?.(error);
      throw error;
    }

    if (!options.parse) return data as T;
    try {
      return options.parse(data);
    } catch (cause) {
      throw new ApiError({
        status: response.status,
        code: "INVALID_RESPONSE",
        message: `Unexpected response shape from ${path}`,
        details: cause,
        requestId,
        cause,
      });
    }
  }

  return {
    request,
    get: <T = unknown>(path: string, options?: MethodOptions<T>) =>
      request<T>(path, { ...options, method: "GET" }),
    post: <T = unknown>(path: string, body?: unknown, options?: MethodOptions<T>) =>
      request<T>(path, { ...options, method: "POST", body }),
    put: <T = unknown>(path: string, body?: unknown, options?: MethodOptions<T>) =>
      request<T>(path, { ...options, method: "PUT", body }),
    patch: <T = unknown>(path: string, body?: unknown, options?: MethodOptions<T>) =>
      request<T>(path, { ...options, method: "PATCH", body }),
    delete: <T = unknown>(path: string, options?: MethodOptions<T>) =>
      request<T>(path, { ...options, method: "DELETE" }),
  };
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  const isJson = response.headers.get("Content-Type")?.includes("json") ?? false;
  if (!isJson) return text;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
