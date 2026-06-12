import { describe, expect, it } from "vitest";
import { AsyncQueue } from "./queue.ts";

describe("AsyncQueue", () => {
  it("runs queued jobs within the configured concurrency", async () => {
    const queue = new AsyncQueue<number>({ concurrency: 1, maxQueueSize: 5 });
    const order: string[] = [];

    const first = queue.add(async () => {
      order.push("first:start");
      await Promise.resolve();
      order.push("first:end");
      return 1;
    });
    const second = queue.add(async () => {
      order.push("second:start");
      order.push("second:end");
      return 2;
    });

    await expect(Promise.all([first, second])).resolves.toEqual([1, 2]);
    expect(order).toEqual(["first:start", "first:end", "second:start", "second:end"]);
    expect(queue.stats()).toMatchObject({ active: 0, pending: 0, completed: 2, failed: 0 });
  });

  it("rejects work when the queue is full", async () => {
    const queue = new AsyncQueue<number>({ concurrency: 0, maxQueueSize: 1 });

    void queue.add(async () => 1);
    await expect(queue.add(async () => 2)).rejects.toThrow("Inference queue is full");
  });
});
