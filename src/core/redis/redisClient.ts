const { createClient } = require('redis');

const client = createClient();

client.on('error', (err) => {
  console.error('Redis connection error:', err);
});

client.connect().catch((err) => {
  console.error('Failed to connect to Redis:', err);
});

module.exports = client;
