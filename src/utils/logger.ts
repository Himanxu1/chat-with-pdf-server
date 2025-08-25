import winston from "winston";

const { combine, timestamp, printf, colorize, errors, json, align } =
  winston.format;

const isProd = process.env["NODE_ENV"] === "production";

const consoleFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  align(),
  printf((info) => {
    const msg = info["stack"] || info.message;
    return `${info["timestamp"]} ${info.level}]${msg}`;
  }),
);

const fileFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  format: fileFormat,
  transports: [
    new winston.transports.Console({
      level: isProd ? "info" : "debug",
      format: consoleFormat,
      handleExceptions: true,
    }),
    new winston.transports.File({
      filename: "logs/app.log",
      level: "info",
      format: fileFormat,
      handleExceptions: true,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: fileFormat,
      handleExceptions: true,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

export default logger;
