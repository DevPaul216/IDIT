import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET all storage locations (with optional parent filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const includeChildren = searchParams.get("includeChildren") === "true";

    const locations = await prisma.storageLocation.findMany({
      where: {
        isActive: true,
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
              where: { isActive: true },
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, x, y, width, height, color, parentId } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const location = await prisma.storageLocation.create({
      data: {
        name,
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
    console.error("Failed to create location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
