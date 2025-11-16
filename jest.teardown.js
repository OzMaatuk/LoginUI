module.exports = async () => {
  // Force close any Redis connections
  try {
    const { closeRedisConnection } = require('./src/lib/redis');
    if (closeRedisConnection) {
      await closeRedisConnection();
    }
  } catch (error) {
    // Ignore if Redis is mocked or not initialized
  }
};
