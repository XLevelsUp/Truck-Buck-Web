/** sessionStorage flag: a lead was sent in this session (the exit prompt then stays away). */
export const LEAD_SENT_KEY = "tb_lead_sent";

export function markLeadSent(): void {
  try {
    window.sessionStorage.setItem(LEAD_SENT_KEY, "1");
  } catch {
    // storage blocked: nothing to remember
  }
}
