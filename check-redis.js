const redis = require("redis");

async function checkRedis() {
  const client = redis.createClient({
    url: "redis://localhost:6379",
  });

  client.on("error", (err) => console.error("Redis Client Error", err));

  await client.connect();

  const pong = await client.ping();
  console.log("Ping response:", pong);

  await client.disconnect();
}

checkRedis().catch(console.error);
