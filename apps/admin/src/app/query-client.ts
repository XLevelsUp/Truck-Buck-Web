import { QueryClient } from "@tanstack/react-query";

import { isApiError } from "@truckbuck/api-client";

const MAX_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Admin data changes, but not second-to-second: avoid refetch storms.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        // Retry only what can succeed on retry (network, 408, 429, 5xx) —
        // never 4xx like 401/403/404/422.
        retry: (failureCount, error) =>
          failureCount < MAX_RETRIES && (!isApiError(error) || error.isRetryable),
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      },
      mutations: {
        // Mutations are not idempotent by default; let the user retry.
        retry: false,
      },
    },
  });
}
