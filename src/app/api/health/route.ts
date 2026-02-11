import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET health check - verify database connection
export async function GET() {
  try {
    // Try to query a simple count
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      status: "ok",
      database: "connected",
      userCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
