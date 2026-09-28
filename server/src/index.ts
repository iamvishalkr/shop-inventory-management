import "dotenv/config";
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes/index.js";
import { authRoutes } from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";
import { generalLimiter } from "./middleware/rate-limiter.middleware.js";
import { connectDB } from "./lib/db.js";
import testSeedProducts from "./utils/testSeedProducts.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname,'..', 'public'); 

const app = express();
const PORT = process.env.PORT || 4000;
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";
app.set('trust proxy', 1); 

app.use(express.static(publicPath));

app.use(
    cors({
        origin: clientUrl,
        credentials: true,
    }),
);

app.use(express.json());

// Mount authentication routes (which have strict internal rate limiting & custom validations)
app.use("/api/auth", authRoutes);

// Apply generous rate limit to all other routes
app.use(generalLimiter);

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.get("/seedProducts", async (req, res, next) => {
    if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ status: false, message: "Forbidden in production" });
    }
    try {
        const result = await testSeedProducts();
        res.json(result);
    } catch (error) {
        next(error);
    }
});


registerRoutes(app);

app.get('*name', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.use(errorHandler)


app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    await connectDB();
});

