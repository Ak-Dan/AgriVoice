import type { QueueStats } from "./queue.ts";

export type BackendMetricsSnapshot = {
  uptimeSeconds: number;
  startedAt: string;
  inferenceRequests: number;
  inferenceFailures: number;
  whatsappRequests: number;
  whatsappFailures: number;
  rateLimitedRequests: number;
  queue: QueueStats;
};

export function createBackendMetrics(startedAt = new Date()) {
  const counters = {
    inferenceRequests: 0,
    inferenceFailures: 0,
    whatsappRequests: 0,
    whatsappFailures: 0,
    rateLimitedRequests: 0,
  };

  return {
    increment(name: keyof typeof counters) {
      counters[name] += 1;
    },

    snapshot(queue: QueueStats): BackendMetricsSnapshot {
      return {
        ...counters,
        startedAt: startedAt.toISOString(),
        uptimeSeconds: Math.round((Date.now() - startedAt.getTime()) / 1000),
        queue,
      };
    },
  };
}
