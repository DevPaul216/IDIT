import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Test endpoint to verify database connection
export async function GET() {
  try {
    // Test 1: Can we connect?
    await prisma.$connect();
    
    // Test 2: Can we query?
    const userCount = await prisma.user.count();
    
    // Test 3: Can we create?
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
      },
    });
    
    // Clean up
    await prisma.user.delete({ where: { id: testUser.id } });
    
    return NextResponse.json({
      success: true,
      message: "Database is working!",
      userCount,
      testUserCreated: true,
    });
  } catch (error: any) {
    console.error("Database test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      name: error.name,
    }, { status: 500 });
  }
}
