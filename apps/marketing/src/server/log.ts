import "server-only";

import { redact } from "@/lib/redact";

/**
 * Server logger. Every argument passes through `redact`, so phone numbers,
 * emails, IPs and personal fields never reach the hosting provider's logs.
 * Errors keep their name and (masked) message, not their full object graph.
 */
const clean = (args: unknown[]) =>
  args.map((arg) => (arg instanceof Error ? redact(`${arg.name}: ${arg.message}`) : redact(arg)));

export const log = {
  warn: (...args: unknown[]) => console.warn(...clean(args)),

  error: (...args: unknown[]) => console.error(...clean(args)),
};
