import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Verify PIN and return user
export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== "string" || pin.length !== 4) {
      return NextResponse.json(
        { error: "PIN muss 4 Ziffern haben" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        pin,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Ungültige PIN" },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("PIN verification failed:", error);
    return NextResponse.json(
      { error: "Authentifizierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
