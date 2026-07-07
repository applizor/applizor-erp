import { Queue, Worker, ConnectionOptions } from 'bullmq';
import IORedis, { RedisOptions } from 'ioredis';
import { config } from '../config/env';

// BullMQ v5+ requires a plain RedisOptions config object, not an IORedis instance.
// We build it once and pass it to both IORedis (for health monitoring) and BullMQ.
let bullMQConnection: ConnectionOptions | null = null;
let redisClient: IORedis | null = null;

if (config.REDIS_URL) {
  try {
    // Parse REDIS_URL into host/port/password for BullMQ's ConnectionOptions
    const url = new URL(config.REDIS_URL);
    const redisOpts: RedisOptions = {
      host:               url.hostname || '127.0.0.1',
      port:               parseInt(url.port || '6379', 10),
      password:           url.password || undefined,
      db:                 url.pathname ? parseInt(url.pathname.slice(1) || '0', 10) : 0,
      maxRetriesPerRequest: null,
      connectTimeout:     2000,
      lazyConnect:        true
    };

    // IORedis instance used only for health-check event listeners
    redisClient = new IORedis(redisOpts);
    redisClient.on('error', (err: Error) => {
      console.warn('⚠️ Redis connection error:', err.message);
    });
    redisClient.on('connect', () => {
      console.log('🔌 Connected to Redis for BullMQ!');
    });
    redisClient.connect().catch((_err: Error) => {
      console.warn('⚠️ Redis connect attempt failed, fallback queue active.');
    });

    // Separate plain options object for BullMQ (no IORedis instance)
    bullMQConnection = {
      host:     redisOpts.host,
      port:     redisOpts.port as number,
      password: redisOpts.password
    };
  } catch (err) {
    console.warn('⚠️ Failed to initialize Redis client, fallback queue active.');
  }
}

export class QueueService {
  private static queues: Record<string, Queue> = {};

  static getQueue(name: string): Queue | null {
    if (!bullMQConnection) return null;

    if (!this.queues[name]) {
      this.queues[name] = new Queue(name, { connection: bullMQConnection });
    }
    return this.queues[name];
  }

  /**
   * Enqueues job if Redis is online, otherwise runs processor directly (inline fallback).
   */
  static async enqueueOrExecute(
    queueName: string,
    jobName: string,
    data: any,
    fallbackProcessor: () => Promise<void>
  ) {
    const queue = this.getQueue(queueName);
    if (queue) {
      try {
        console.log(`[Queue] BullMQ: Enqueueing job "${jobName}" into queue "${queueName}"`);
        await queue.add(jobName, data);
      } catch (err: any) {
        console.warn(`[Queue] BullMQ enqueue failed, executing fallback:`, err.message);
        await fallbackProcessor();
      }
    } else {
      console.log(`[Queue] Fallback: Executing job "${jobName}" synchronously.`);
      await fallbackProcessor();
    }
  }

  /**
   * Registers a BullMQ Worker if Redis is available; silently skips if offline.
   */
  static registerWorker(queueName: string, processor: (job: any) => Promise<void>) {
    if (bullMQConnection) {
      console.log(`[Queue] BullMQ: Registering worker for queue "${queueName}"`);
      new Worker(queueName, processor, { connection: bullMQConnection });
    } else {
      console.log(`[Queue] Fallback: Redis offline, worker registration skipped for "${queueName}".`);
    }
  }
}
