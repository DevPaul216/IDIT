import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT update location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, x, y, width, height, color, capacity, parentId } = body;

    // If trying to set capacity, verify this is a leaf location (no children)
    if (capacity !== undefined) {
      const children = await prisma.storageLocation.findMany({
        where: { parentId: id },
      });
      if (children.length > 0) {
        return NextResponse.json(
          { error: "Kapazität kann nur auf Blattknoten (ohne Unterbereiche) gesetzt werden" },
          { status: 400 }
        );
      }
    }

    // If trying to change parentId, verify parent exists and prevent circular references
    if (parentId !== undefined) {
      if (parentId) {
        const parent = await prisma.storageLocation.findUnique({
          where: { id: parentId },
        });
        if (!parent) {
          return NextResponse.json(
            { error: "Übergeordneter Bereich nicht gefunden" },
            { status: 400 }
          );
        }

        // Prevent circular reference
        let current: string | null = parentId;
        const visited = new Set<string>();
        while (current) {
          if (current === id) {
            return NextResponse.json(
              { error: "Zirkelbezug erkannt: Dieser Bereich kann nicht sein eigener Übergeordneter sein" },
              { status: 400 }
            );
          }
          if (visited.has(current)) break;
          visited.add(current);
          const parentLoc = await prisma.storageLocation.findUnique({
            where: { id: current },
          });
          current = parentLoc?.parentId ?? null;
        }
      }
    }

    const location = await prisma.storageLocation.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(x !== undefined && { x }),
        ...(y !== undefined && { y }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(color !== undefined && { color }),
        ...(capacity !== undefined && { capacity }),
        ...(parentId !== undefined && { parentId: parentId || null }),
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error("Failed to update location:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}

// DELETE location (hard delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if location has children
    const children = await prisma.storageLocation.findMany({
      where: { parentId: id },
    });
    if (children.length > 0) {
      return NextResponse.json(
        { error: "Dieser Lagerplatz hat Unterbereiche. Bitte zuerst die Unterbereiche löschen." },
        { status: 400 }
      );
    }

    await prisma.storageLocation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete location:", error);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    );
  }
}
