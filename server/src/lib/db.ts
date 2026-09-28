// import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export async function connectDB() {
    try {
        await prisma.$connect();
        console.log("Database connected successfully.");
    } catch (error: any) {
        console.error("Database connection failed:", error?.message || error);
    }
}

export default prisma;
