import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET inventory change logs
// Query params:
//   - limit: max number of entries (default 100)
//   - locationId: filter by location
//   - productId: filter by product
//   - userId: filter by who made the change
//   - from: start date (ISO string)
//   - to: end date (ISO string)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const locationId = searchParams.get("locationId");
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (locationId) where.locationId = locationId;
    if (productId) where.productId = productId;
    if (userId) where.changedById = userId;

    if (from || to) {
      where.changedAt = {};
      if (from) (where.changedAt as Record<string, Date>).gte = new Date(from);
      if (to) (where.changedAt as Record<string, Date>).lte = new Date(to);
    }

    const logs = await prisma.inventoryLog.findMany({
      where,
      take: limit,
      orderBy: { changedAt: "desc" },
      include: {
        location: {
          select: { id: true, name: true, parentId: true },
        },
        product: {
          select: { id: true, name: true, code: true, color: true },
        },
        changedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch inventory logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory logs" },
      { status: 500 }
    );
  }
}
