import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET current inventory state
// Query params:
//   - locationId: filter by specific location
//   - parentId: filter by parent location (get all children)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const parentId = searchParams.get("parentId");

    const where: Record<string, unknown> = {};

    if (locationId) {
      where.locationId = locationId;
    } else if (parentId) {
      // Get inventory for all child locations of this parent
      const childLocations = await prisma.storageLocation.findMany({
        where: { parentId },
        select: { id: true },
      });
      where.locationId = { in: childLocations.map((l) => l.id) };
    }

    const inventory = await prisma.currentInventory.findMany({
      where,
      include: {
        location: true,
        product: true,
        lastCheckedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { location: { name: "asc" } },
        { product: { name: "asc" } },
      ],
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// POST/PUT update inventory entries
// Body: { entries: [{ locationId, productId, quantity }], userId }
// This upserts current inventory AND logs all changes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entries, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 });
    }

    // Verify user exists (important after database resets)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND", message: "User session invalid. Please log out and log in again." },
        { status: 401 }
      );
    }

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

    // Process each entry: upsert current inventory + create log
    const results = await prisma.$transaction(async (tx) => {
      const processed = [];

      for (const entry of entries) {
        const { locationId, productId, quantity } = entry;

        // Find existing inventory entry
        const existing = await tx.currentInventory.findUnique({
          where: {
            locationId_productId: { locationId, productId },
          },
        });

        const previousQty = existing?.quantity ?? null;

        // Only log if quantity actually changed (or if first entry)
        const shouldLog = previousQty === null || previousQty !== quantity;

        // Upsert current inventory
        const updated = await tx.currentInventory.upsert({
          where: {
            locationId_productId: { locationId, productId },
          },
          create: {
            locationId,
            productId,
            quantity,
            lastCheckedById: userId,
          },
          update: {
            quantity,
            lastCheckedAt: new Date(),
            lastCheckedById: userId,
          },
          include: {
            location: true,
            product: true,
          },
        });

        // Create log entry if something changed
        if (shouldLog) {
          await tx.inventoryLog.create({
            data: {
              locationId,
              productId,
              previousQty,
              newQty: quantity,
              changedById: userId,
            },
          });
        }

        processed.push({
          ...updated,
          changed: shouldLog,
          previousQty,
        });
      }

      return processed;
    });

    const changedCount = results.filter((r) => r.changed).length;

    return NextResponse.json(
      {
        message: `${results.length} Einträge gespeichert, ${changedCount} Änderungen protokolliert`,
        entries: results,
        changedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update inventory:", error);
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}
