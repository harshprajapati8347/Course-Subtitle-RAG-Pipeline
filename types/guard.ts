/** Result of running a user question through the input guard. */
export interface GuardResult {
  passed: boolean;
  reason?: string;
}
