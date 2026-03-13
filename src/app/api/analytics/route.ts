import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET analytics data
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run all independent queries in parallel.
    // inventorySnapshot uses minimal select (3 columns, no joins) instead of
    // loading full relations for every row — significantly less data over the wire.
    const [inventorySnapshot, freshness, locations, products, recentLogs] =
      await Promise.all([
        prisma.currentInventory.findMany({
          select: { locationId: true, productId: true, quantity: true },
        }),
        prisma.currentInventory.aggregate({
          _min: { lastCheckedAt: true },
          _max: { lastCheckedAt: true },
        }),
        prisma.storageLocation.findMany({
          include: {
            parent: { select: { id: true, name: true } },
            children: { select: { id: true } },
          },
        }),
        prisma.productVariant.findMany(),
        prisma.inventoryLog.findMany({
          where: { changedAt: { gte: oneMonthAgo } },
          include: { location: true, product: true, changedBy: true },
          orderBy: { changedAt: "asc" },
        }),
      ]);

    // Summary metrics
    const totalItems = inventorySnapshot.reduce((sum, inv) => sum + inv.quantity, 0);
    const uniqueLocationsWithStock = new Set(
      inventorySnapshot.filter((i) => i.quantity > 0).map((i) => i.locationId)
    ).size;
    const uniqueProductsInStock = new Set(
      inventorySnapshot.filter((i) => i.quantity > 0).map((i) => i.productId)
    ).size;

    // Product breakdown
    const productTotals = products
      .map((product) => {
        const entries = inventorySnapshot.filter((inv) => inv.productId === product.id);
        const total = entries.reduce((sum, inv) => sum + inv.quantity, 0);
        const locationCount = entries.filter((inv) => inv.quantity > 0).length;
        return {
          id: product.id,
          name: product.name,
          code: product.code,
          color: product.color,
          totalQuantity: total,
          locationCount,
        };
      })
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    // Location utilization (leaf locations only)
    const leafLocations = locations.filter((loc) => loc.children.length === 0);
    const locationUtilization = leafLocations
      .map((location) => {
        const totalQuantity = inventorySnapshot
          .filter((inv) => inv.locationId === location.id)
          .reduce((sum, inv) => sum + inv.quantity, 0);
        const utilizationPercent = location.capacity
          ? Math.round((totalQuantity / location.capacity) * 100)
          : null;
        return {
          id: location.id,
          name: location.name,
          parentName: location.parent?.name || null,
          capacity: location.capacity,
          currentStock: totalQuantity,
          utilizationPercent,
        };
      })
      .sort((a, b) => (b.utilizationPercent ?? -1) - (a.utilizationPercent ?? -1));

    // Activity by day (last 7 days)
    const activityByDay: Record<string, { date: string; changes: number; totalAdded: number; totalRemoved: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      activityByDay[dateKey] = { date: dateKey, changes: 0, totalAdded: 0, totalRemoved: 0 };
    }

    recentLogs
      .filter((log) => log.changedAt >= oneWeekAgo)
      .forEach((log) => {
        const dateKey = log.changedAt.toISOString().split("T")[0];
        if (activityByDay[dateKey]) {
          activityByDay[dateKey].changes++;
          const diff = log.newQty - (log.previousQty ?? 0);
          if (diff > 0) {
            activityByDay[dateKey].totalAdded += diff;
          } else {
            activityByDay[dateKey].totalRemoved += Math.abs(diff);
          }
        }
      });

    // Stock trend over time (last 30 days, approximated from logs)
    const stockHistory: { date: string; totalStock: number }[] = [];
    let runningTotal = totalItems;

    const logsByDay = new Map<string, typeof recentLogs>();
    recentLogs.forEach((log) => {
      const dateKey = log.changedAt.toISOString().split("T")[0];
      if (!logsByDay.has(dateKey)) logsByDay.set(dateKey, []);
      logsByDay.get(dateKey)!.push(log);
    });

    for (let i = 0; i <= 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      stockHistory.unshift({ date: dateKey, totalStock: runningTotal });
      const logsForDay = logsByDay.get(dateKey) || [];
      logsForDay.forEach((log) => {
        runningTotal -= log.newQty - (log.previousQty ?? 0);
      });
    }

    // Top movers (products with most activity in last 30 days)
    const productActivity = new Map<string, { added: number; removed: number; changes: number }>();
    recentLogs.forEach((log) => {
      if (!productActivity.has(log.productId)) {
        productActivity.set(log.productId, { added: 0, removed: 0, changes: 0 });
      }
      const activity = productActivity.get(log.productId)!;
      activity.changes++;
      const diff = log.newQty - (log.previousQty ?? 0);
      if (diff > 0) activity.added += diff;
      else activity.removed += Math.abs(diff);
    });

    const topMovers = products
      .map((product) => {
        const activity = productActivity.get(product.id) || { added: 0, removed: 0, changes: 0 };
        return {
          id: product.id,
          name: product.name,
          code: product.code,
          color: product.color,
          ...activity,
          totalMovement: activity.added + activity.removed,
        };
      })
      .filter((p) => p.totalMovement > 0)
      .sort((a, b) => b.totalMovement - a.totalMovement)
      .slice(0, 5);

    // Staff activity
    const staffActivity = new Map<string, { userId: string; userName: string; changes: number; lastActivity: Date }>();
    recentLogs.forEach((log) => {
      if (!staffActivity.has(log.changedById)) {
        staffActivity.set(log.changedById, {
          userId: log.changedById,
          userName: log.changedBy?.name || "Unbekannt",
          changes: 0,
          lastActivity: log.changedAt,
        });
      }
      const activity = staffActivity.get(log.changedById)!;
      activity.changes++;
      if (log.changedAt > activity.lastActivity) activity.lastActivity = log.changedAt;
    });

    const staffActivityList = Array.from(staffActivity.values()).sort(
      (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()
    );

    // Category breakdown — uses product.category directly (not via inventory lookup)
    const categoryBreakdown = new Map<string, { category: string; quantity: number; productCount: number }>();
    products.forEach((product) => {
      const cat = product.category || "other";
      if (!categoryBreakdown.has(cat)) {
        categoryBreakdown.set(cat, { category: cat, quantity: 0, productCount: 0 });
      }
      const entry = categoryBreakdown.get(cat)!;
      const total = productTotals.find((pt) => pt.id === product.id);
      entry.quantity += total?.totalQuantity ?? 0;
      entry.productCount++;
    });

    const categoryData = Array.from(categoryBreakdown.values()).sort(
      (a, b) => b.quantity - a.quantity
    );

    return NextResponse.json({
      summary: {
        totalItems,
        uniqueLocationsWithStock,
        uniqueProductsInStock,
        totalLocations: leafLocations.length,
        totalProducts: products.length,
        changesThisWeek: Object.values(activityByDay).reduce((sum, d) => sum + d.changes, 0),
      },
      productTotals,
      locationUtilization,
      activityByDay: Object.values(activityByDay),
      stockHistory,
      topMovers,
      staffActivity: staffActivityList,
      categoryData,
      dataFreshness: {
        oldestCheckAt: freshness._min.lastCheckedAt || null,
        newestCheckAt: freshness._max.lastCheckedAt || null,
      },
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
