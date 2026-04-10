import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connection from "./models/connection.js";
import placeRoutes from "./routes/placeRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

await connection();

app.use("/api", placeRoutes); // 🔥 THIS IS REQUIRED

app.listen(process.env.PORT, () => {
  console.log("Server running on port 5000");
});