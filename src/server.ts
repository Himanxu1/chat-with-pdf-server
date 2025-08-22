import express from "express";
import cors from "cors";
import appRouter from "./routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.get("/", (req, res) => {
  res.send("Welcome to the ChatPDF server!");
});

app.use("/api/v1", appRouter);

export default app;
