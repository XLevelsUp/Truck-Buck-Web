export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "ABORTED"
  | "INVALID_RESPONSE"
  | "TENANT_REQUIRED"
  // Server-defined codes (e.g. TOKEN_EXPIRED) pass through; `string & {}`
  // keeps autocomplete for the known codes above.
  | (string & {});

/** The single error type every api-client call rejects with. */
export class ApiError extends Error {
  override readonly name = "ApiError";
  /** HTTP status, or 0 when no response was received. */
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: unknown;
  readonly requestId: string | null;

  constructor(init: {
    status: number;
    code: ApiErrorCode;
    message: string;
    details?: unknown;
    requestId?: string | null;
    cause?: unknown;
  }) {
    super(init.message, { cause: init.cause });
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.requestId = init.requestId ?? null;
  }

  /** True when retrying the same request may succeed. */
  get isRetryable(): boolean {
    return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function codeForStatus(status: number): ApiErrorCode {
  switch (status) {
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "VALIDATION_FAILED";
    case 429:
      return "RATE_LIMITED";
    default:
      return status >= 500 ? "SERVER_ERROR" : "BAD_REQUEST";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Accepts both our target envelope `{ code, message, details }` and the
 * NestJS default `{ statusCode, message: string | string[], error }`.
 */
export function normalizeErrorBody(
  status: number,
  body: unknown,
  requestId: string | null,
): ApiError {
  if (isRecord(body)) {
    const messages = Array.isArray(body.message) ? body.message.map(String) : null;
    const message =
      messages?.join("; ") ??
      (typeof body.message === "string" ? body.message : undefined) ??
      (typeof body.error === "string" ? body.error : undefined) ??
      `Request failed with status ${status}`;
    return new ApiError({
      status,
      code: typeof body.code === "string" ? body.code : codeForStatus(status),
      message,
      details: body.details ?? messages ?? undefined,
      requestId,
    });
  }
  return new ApiError({
    status,
    code: codeForStatus(status),
    message: typeof body === "string" && body ? body : `Request failed with status ${status}`,
    requestId,
  });
}
