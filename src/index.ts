import * as http from "http";
import logger from "./utils/logger.js";
import app from "./server.js";

// later we can user UV_THREADPOOL_SIZE for performance and use multiple cpu cores

const main = async () => {
  const server = http.createServer(app);

  server.listen(3001, () => {
    logger.info("this is server");
    console.log("Server is running on http://localhost:3001");
  });

  server.on("close", () => {
    console.log("Server is shutting down...");
  });

  server.on("error", (err) => {
    console.error("Server error:", err);
  });
};

main();
