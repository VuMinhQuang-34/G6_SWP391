import redis from "redis";

// Tạo client Redis với URL được cấu hình từ biến môi trường
const client = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || "localhost"}:${
    process.env.REDIS_PORT || 6379
  }`,
});

client.on("error", (err) => {
  console.error("Redis error:", err.message);
});

(async () => {
  try {
    await client.connect();
    console.log("Connected to Redis");
  } catch (err) {
    console.error("Error connecting to Redis:", err.message);
  }
})();

export default client;
