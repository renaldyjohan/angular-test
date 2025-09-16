import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import imageRoutes from "./routes/images";
import { connectDb } from "./services/mongo";
import { errorHandler } from "./middlewares/errorHandler";
import { setupSwagger } from "./swagger";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

setupSwagger(app);

app.use(cors());
app.use(express.json());

app.use("/images", imageRoutes);

app.get("/health", (req, res) => {
  res.json({ success: true, code: 200, message: "Backend is running" });
});

app.use(errorHandler);

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
