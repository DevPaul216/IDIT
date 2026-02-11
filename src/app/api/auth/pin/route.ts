import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST authenticate user by PIN
export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || pin.length !== 4) {
      return NextResponse.json(
        { error: "Invalid PIN format" },
        { status: 400 }
      );
    }

    // Find user by PIN
    const user = await prisma.user.findFirst({
      where: {
        pin: pin,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    // Return user without PIN
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("PIN authentication error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
