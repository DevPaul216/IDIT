import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all product variants
export async function GET() {
  try {
    const products = await prisma.productVariant.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST create new product variant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, category, color } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const product = await prisma.productVariant.create({
      data: {
        name,
        code: code || null,
        category: category || "finished",
        color: color || null,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
