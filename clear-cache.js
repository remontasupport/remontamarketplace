// Quick script to clear Redis cache
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

async function clearCache() {
  try {
    // Clear all cache keys
    const keys = await redis.keys('*');
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`✅ Cleared ${keys.length} cache keys`);
    } else {
      console.log('ℹ️  No cache keys found');
    }
    await redis.quit();
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }
}

clearCache();
