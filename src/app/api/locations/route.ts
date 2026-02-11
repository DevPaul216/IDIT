import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all storage locations (with optional parent filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const includeChildren = searchParams.get("includeChildren") === "true";

    const locations = await prisma.storageLocation.findMany({
      where: {
        // If parentId is "null", get root locations; if provided, get children of that parent
        ...(parentId === "null"
          ? { parentId: null }
          : parentId
          ? { parentId }
          : {}),
      },
      include: {
        children: includeChildren
          ? {
              orderBy: { name: "asc" },
            }
          : false,
        _count: {
          select: { children: true },
        },
      },
      orderBy: [{ y: "asc" }, { x: "asc" }],
    });

    // Transform to include childCount
    const locationsWithCount = locations.map((loc) => ({
      ...loc,
      childCount: loc._count.children,
      _count: undefined,
    }));

    return NextResponse.json(locationsWithCount);
  } catch (error) {
    console.error("Failed to fetch locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

// POST create new location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, x, y, width, height, color, parentId } = body;

    const trimmedName = name?.trim();
    if (!trimmedName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if parent exists (if provided)
    if (parentId) {
      const parent = await prisma.storageLocation.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return NextResponse.json({ error: "Parent location not found" }, { status: 400 });
      }
    }

    try {
      const location = await prisma.storageLocation.create({
        data: {
          name: trimmedName,
          description: description || null,
          parentId: parentId || null,
          x: x ?? 0,
          y: y ?? 0,
          width: width ?? 1,
          height: height ?? 1,
          color: color || null,
        },
      });

      return NextResponse.json(location, { status: 201 });
    } catch (error) {
      // Check for unique constraint violation
      if (error instanceof Error && error.message.includes("Unique constraint failed")) {
        return NextResponse.json(
          { error: "Ein Lagerplatz mit diesem Namen existiert bereits im gleichen Bereich" },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Failed to create location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
