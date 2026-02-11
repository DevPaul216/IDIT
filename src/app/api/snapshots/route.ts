import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET all snapshots (with optional limit)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const snapshots = await prisma.inventorySnapshot.findMany({
      take: limit,
      orderBy: { takenAt: "desc" },
      include: {
        takenBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { entries: true },
        },
      },
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    console.error("Failed to fetch snapshots:", error);
    return NextResponse.json(
      { error: "Failed to fetch snapshots" },
      { status: 500 }
    );
  }
}

// POST create new snapshot with entries
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notes, entries } = body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "At least one inventory entry is required" },
        { status: 400 }
      );
    }

    // Validate entries
    for (const entry of entries) {
      if (!entry.locationId || !entry.productId || entry.quantity === undefined) {
        return NextResponse.json(
          { error: "Each entry must have locationId, productId, and quantity" },
          { status: 400 }
        );
      }
    }

    // Create snapshot with all entries in a transaction
    const snapshot = await prisma.inventorySnapshot.create({
      data: {
        takenById: session.user.id,
        notes: notes || null,
        entries: {
          create: entries.map((entry: { locationId: string; productId: string; quantity: number }) => ({
            locationId: entry.locationId,
            productId: entry.productId,
            quantity: entry.quantity,
          })),
        },
      },
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

    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    console.error("Failed to create snapshot:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 }
    );
  }
}
