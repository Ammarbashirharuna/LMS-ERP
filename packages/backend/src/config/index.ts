import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "..", "..", ".env"), override: true });

export interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  redisUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  geminiApiKey: string;
  geminiModel: string;
  frontendUrl: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  resendApiKey: string;
  paystackSecretKey: string;
}

const required = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "GEMINI_API_KEY", "DATABASE_URL", "REDIS_URL"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}. Copy .env.example to .env and fill in values.`);
  }
}

export const config: Config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL!,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  geminiApiKey: process.env.GEMINI_API_KEY!,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  resendApiKey: process.env.RESEND_API_KEY || "",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || "",
};
