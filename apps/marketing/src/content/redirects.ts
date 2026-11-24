/**
 * Permanent (301) redirects from the old truckbuck.in URLs to their new
 * homes, so links and rankings carry over. Empty until the client sends the
 * current URL list or Search Console access (NFC-20). Each entry:
 *   { source: "/old-path", destination: "/new-path" }
 * Sources use Next.js path syntax (":slug", ":path*" wildcards).
 */
export const legacyRedirects: readonly { source: string; destination: string }[] = [];
