import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET analytics data
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all current inventory with relations
    const currentInventory = await prisma.currentInventory.findMany({
      include: {
        location: true,
        product: true,
      },
    });

    // Get all locations with capacity info
    const locations = await prisma.storageLocation.findMany({
      include: {
        parent: true,
        children: true,
      },
    });

    // Get all products
    const products = await prisma.productVariant.findMany();

    // Get inventory logs for trend analysis
    const recentLogs = await prisma.inventoryLog.findMany({
      where: {
        changedAt: { gte: oneMonthAgo },
      },
      include: {
        location: true,
        product: true,
        changedBy: true,
      },
      orderBy: { changedAt: "asc" },
    });

    // Calculate metrics
    const totalItems = currentInventory.reduce((sum, inv) => sum + inv.quantity, 0);
    const uniqueLocationsWithStock = new Set(currentInventory.filter(i => i.quantity > 0).map(i => i.locationId)).size;
    const uniqueProductsInStock = new Set(currentInventory.filter(i => i.quantity > 0).map(i => i.productId)).size;

    // Product breakdown
    const productTotals = products.map((product) => {
      const inventoryForProduct = currentInventory.filter((inv) => inv.productId === product.id);
      const total = inventoryForProduct.reduce((sum, inv) => sum + inv.quantity, 0);
      const locationCount = inventoryForProduct.filter((inv) => inv.quantity > 0).length;
      return {
        id: product.id,
        name: product.name,
        code: product.code,
        color: product.color,
        totalQuantity: total,
        locationCount,
      };
    }).sort((a, b) => b.totalQuantity - a.totalQuantity);

    // Location utilization (for locations with capacity set)
    const leafLocations = locations.filter((loc) => loc.children.length === 0);
    const locationUtilization = leafLocations.map((location) => {
      const inventoryAtLocation = currentInventory.filter((inv) => inv.locationId === location.id);
      const totalQuantity = inventoryAtLocation.reduce((sum, inv) => sum + inv.quantity, 0);
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
    }).sort((a, b) => (b.utilizationPercent ?? -1) - (a.utilizationPercent ?? -1));

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

    // Stock trend over time (aggregated by day for last 30 days)
    // This is approximated from logs - we work backwards from current state
    const stockHistory: { date: string; totalStock: number }[] = [];
    let runningTotal = totalItems;
    
    // Group logs by day in reverse order
    const logsByDay = new Map<string, typeof recentLogs>();
    recentLogs.forEach((log) => {
      const dateKey = log.changedAt.toISOString().split("T")[0];
      if (!logsByDay.has(dateKey)) {
        logsByDay.set(dateKey, []);
      }
      logsByDay.get(dateKey)!.push(log);
    });

    // Build history going backwards
    for (let i = 0; i <= 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      
      stockHistory.unshift({ date: dateKey, totalStock: runningTotal });
      
      // Subtract the changes made on this day to get previous day's total
      const logsForDay = logsByDay.get(dateKey) || [];
      logsForDay.forEach((log) => {
        const diff = log.newQty - (log.previousQty ?? 0);
        runningTotal -= diff;
      });
    }

    // Top movers (products with most activity)
    const productActivity = new Map<string, { added: number; removed: number; changes: number }>();
    recentLogs.forEach((log) => {
      const key = log.productId;
      if (!productActivity.has(key)) {
        productActivity.set(key, { added: 0, removed: 0, changes: 0 });
      }
      const activity = productActivity.get(key)!;
      activity.changes++;
      const diff = log.newQty - (log.previousQty ?? 0);
      if (diff > 0) {
        activity.added += diff;
      } else {
        activity.removed += Math.abs(diff);
      }
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

    // Staff activity (who checked what and when)
    const staffActivity = new Map<string, { userId: string; userName: string; changes: number; lastActivity: Date }>();
    recentLogs.forEach((log) => {
      const key = log.changedById;
      if (!staffActivity.has(key)) {
        staffActivity.set(key, { userId: key, userName: log.changedBy?.name || "Unbekannt", changes: 0, lastActivity: log.changedAt });
      }
      const activity = staffActivity.get(key)!;
      activity.changes++;
      if (log.changedAt > activity.lastActivity) {
        activity.lastActivity = log.changedAt;
      }
    });

    const staffActivityList = Array.from(staffActivity.values())
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    // Category breakdown
    const categoryBreakdown = new Map<string, { category: string; quantity: number; productCount: number }>();
    productTotals.forEach((product) => {
      const inv = currentInventory.find(i => i.productId === product.id);
      const cat = inv?.product?.category || "other";
      if (!categoryBreakdown.has(cat)) {
        categoryBreakdown.set(cat, { category: cat, quantity: 0, productCount: 0 });
      }
      const entry = categoryBreakdown.get(cat)!;
      entry.quantity += product.totalQuantity;
      entry.productCount++;
    });

    const categoryData = Array.from(categoryBreakdown.values())
      .sort((a, b) => b.quantity - a.quantity);

    // Data freshness - how old is the oldest checked inventory
    const oldestCheck = currentInventory.length > 0
      ? currentInventory.reduce((oldest, curr) => 
          curr.lastCheckedAt < oldest.lastCheckedAt 
            ? curr 
            : oldest
        )
      : null;

    const newestCheck = currentInventory.length > 0
      ? currentInventory.reduce((newest, curr) => 
          curr.lastCheckedAt > newest.lastCheckedAt 
            ? curr 
            : newest
        )
      : null;

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
        oldestCheckAt: oldestCheck?.lastCheckedAt || null,
        newestCheckAt: newestCheck?.lastCheckedAt || null,
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
