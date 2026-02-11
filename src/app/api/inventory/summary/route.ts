import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET summary of current inventory state
// Returns: total pallets, locations checked, freshness info
export async function GET() {
  try {
    // Get all current inventory grouped by location
    const inventory = await prisma.currentInventory.findMany({
      include: {
        location: {
          select: { id: true, name: true, parentId: true },
        },
        product: {
          select: { id: true, name: true, category: true, color: true },
        },
      },
    });

    // Calculate totals
    const totalPallets = inventory.reduce((sum, i) => sum + i.quantity, 0);
    const uniqueLocations = new Set(inventory.map((i) => i.locationId)).size;

    // Find oldest and newest check dates
    const checkDates = inventory.map((i) => new Date(i.lastCheckedAt).getTime());
    const oldestCheck = checkDates.length > 0 ? new Date(Math.min(...checkDates)) : null;
    const newestCheck = checkDates.length > 0 ? new Date(Math.max(...checkDates)) : null;

    // Group by location to get per-location summary
    const byLocation = inventory.reduce((acc, item) => {
      if (!acc[item.locationId]) {
        acc[item.locationId] = {
          location: item.location,
          totalPallets: 0,
          productCount: 0,
          lastCheckedAt: item.lastCheckedAt,
        };
      }
      acc[item.locationId].totalPallets += item.quantity;
      acc[item.locationId].productCount += 1;
      // Keep the most recent check date for this location
      if (new Date(item.lastCheckedAt) > new Date(acc[item.locationId].lastCheckedAt)) {
        acc[item.locationId].lastCheckedAt = item.lastCheckedAt;
      }
      return acc;
    }, {} as Record<string, { location: { id: string; name: string; parentId: string | null }; totalPallets: number; productCount: number; lastCheckedAt: Date }>);

    // Group by product for product summary
    const byProduct = inventory.reduce((acc, item) => {
      if (!acc[item.productId]) {
        acc[item.productId] = {
          product: item.product,
          totalPallets: 0,
          locationCount: 0,
        };
      }
      acc[item.productId].totalPallets += item.quantity;
      acc[item.productId].locationCount += 1;
      return acc;
    }, {} as Record<string, { product: { id: string; name: string }; totalPallets: number; locationCount: number }>);

    return NextResponse.json({
      totalPallets,
      uniqueLocations,
      oldestCheck,
      newestCheck,
      byLocation: Object.values(byLocation),
      byProduct: Object.values(byProduct),
    });
  } catch (error) {
    console.error("Failed to fetch inventory summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory summary" },
      { status: 500 }
    );
  }
}
