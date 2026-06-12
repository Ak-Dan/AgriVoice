export type QueueStats = {
  active: number;
  pending: number;
  completed: number;
  failed: number;
  maxQueueSize: number;
  concurrency: number;
};

type QueueJob<T> = {
  reject: (error: unknown) => void;
  resolve: (value: T) => void;
  task: () => Promise<T>;
};

export class AsyncQueue<T> {
  private active = 0;
  private completed = 0;
  private failed = 0;
  private readonly jobs: QueueJob<T>[] = [];

  constructor(
    private readonly options: {
      concurrency: number;
      maxQueueSize: number;
    },
  ) {}

  add(task: () => Promise<T>): Promise<T> {
    if (this.jobs.length >= this.options.maxQueueSize) {
      return Promise.reject(new Error("Inference queue is full"));
    }

    return new Promise<T>((resolve, reject) => {
      this.jobs.push({ task, resolve, reject });
      this.drain();
    });
  }

  stats(): QueueStats {
    return {
      active: this.active,
      pending: this.jobs.length,
      completed: this.completed,
      failed: this.failed,
      maxQueueSize: this.options.maxQueueSize,
      concurrency: this.options.concurrency,
    };
  }

  private drain() {
    while (this.active < this.options.concurrency && this.jobs.length > 0) {
      const job = this.jobs.shift();
      if (!job) {
        return;
      }

      this.active += 1;
      void job
        .task()
        .then((value) => {
          this.completed += 1;
          job.resolve(value);
        })
        .catch((error) => {
          this.failed += 1;
          job.reject(error);
        })
        .finally(() => {
          this.active -= 1;
          this.drain();
        });
    }
  }
}
