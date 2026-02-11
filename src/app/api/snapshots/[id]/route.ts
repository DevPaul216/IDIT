import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET single snapshot with all entries
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const snapshot = await prisma.inventorySnapshot.findUnique({
      where: { id },
      include: {
        takenBy: {
          select: { id: true, name: true, email: true },
        },
        entries: {
          include: {
            location: true,
            product: true,
          },
        },
      },
    });

    if (!snapshot) {
      return NextResponse.json(
        { error: "Snapshot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Failed to fetch snapshot:", error);
    return NextResponse.json(
      { error: "Failed to fetch snapshot" },
      { status: 500 }
    );
  }
}
