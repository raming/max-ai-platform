// Idempotency storage for webhook ingress

interface IdempotencyRecord {
  key: string;
  timestamp: number;
  expiresAt: number;
}

export class IdempotencyStore {
  private records = new Map<string, IdempotencyRecord>();
  private readonly windowMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if an idempotency key is valid (not seen before in the window)
   * Returns true if the key is valid (can proceed), false if duplicate
   */
  checkAndStore(key: string): boolean {
    const now = Date.now();

    // Clean up expired records
    this.cleanup();

    if (this.records.has(key)) {
      return false; // Duplicate
    }

    // Store the key
    const record: IdempotencyRecord = {
      key,
      timestamp: now,
      expiresAt: now + this.windowMs
    };

    this.records.set(key, record);
    return true; // Valid
  }

  /**
   * Remove expired records
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (record.expiresAt < now) {
        this.records.delete(key);
      }
    }
  }

  /**
   * Clear all records (for testing)
   */
  clear(): void {
    this.records.clear();
  }
}

// Global instance
export const idempotencyStore = new IdempotencyStore();