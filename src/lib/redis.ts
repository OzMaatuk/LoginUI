import Redis from 'ioredis';

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    
    // Handle connection errors gracefully
    redisClient.on('error', (err) => {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Redis connection error:', err);
      }
    });
  }
  return redisClient;
}

export async function setSession(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
  const redis = getRedisClient();
  await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(data));
}

export async function getSession(sessionId: string): Promise<any | null> {
  const redis = getRedisClient();
  const data = await redis.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(`session:${sessionId}`);
}

// Export function to close connection for cleanup
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    redisClient.disconnect();
    redisClient = null;
  }
}

const redis = getRedisClient();
export default redis;
