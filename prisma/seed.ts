import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.inventoryEntry.deleteMany();
  await prisma.inventorySnapshot.deleteMany();
  await prisma.storageLocation.deleteMany();
  await prisma.productVariant.deleteMany();

  // ==========================================
  // Create parent storage locations (floors/buildings)
  // ==========================================
  console.log("📍 Creating main storage areas...");

  const ug = await prisma.storageLocation.create({
    data: { name: "UG", description: "Untergeschoss", x: 0, y: 0, width: 2, height: 2, color: "#6366f1" },
  });

  const eg = await prisma.storageLocation.create({
    data: { name: "EG", description: "Erdgeschoss", x: 3, y: 0, width: 2, height: 2, color: "#22c55e" },
  });

  const og = await prisma.storageLocation.create({
    data: { name: "OG", description: "Obergeschoss", x: 6, y: 0, width: 2, height: 2, color: "#f59e0b" },
  });

  const halle204 = await prisma.storageLocation.create({
    data: { name: "Halle 204", description: "Lagerhalle 204", x: 0, y: 3, width: 3, height: 2, color: "#ec4899" },
  });

  const halle205 = await prisma.storageLocation.create({
    data: { name: "Halle 205", description: "Lagerhalle 205", x: 4, y: 3, width: 3, height: 2, color: "#14b8a6" },
  });

  // ==========================================
  // Create sub-locations within each area
  // ==========================================
  console.log("📍 Creating sub-locations...");

  // UG sub-locations
  const ugSubs = [
    { name: "Wachsraum", description: "UG - Wachsraum", x: 0, y: 0, width: 1, height: 1 },
    { name: "Zwischenlager Produktion", description: "UG - Zwischenlager", x: 1, y: 0, width: 1, height: 1 },
    { name: "Fertiglager", description: "UG - Fertiglager", x: 0, y: 1, width: 1, height: 1 },
    { name: "Holzwollnische", description: "UG - Holzwollnische", x: 1, y: 1, width: 1, height: 1 },
  ];

  for (const sub of ugSubs) {
    await prisma.storageLocation.create({
      data: { ...sub, parentId: ug.id, color: "#6366f1" },
    });
  }

  // EG sub-locations
  const egSubs = [
    { name: "MST", description: "EG - MST", x: 0, y: 0, width: 1, height: 2 },
    { name: "Oberndorfer", description: "EG - Oberndorfer", x: 1, y: 0, width: 1, height: 2 },
  ];

  for (const sub of egSubs) {
    await prisma.storageLocation.create({
      data: { ...sub, parentId: eg.id, color: "#22c55e" },
    });
  }

  // OG sub-locations
  const ogSubs = [
    { name: "Schachtelware", description: "OG - Schachtelware", x: 0, y: 0, width: 1, height: 2 },
    { name: "Notreserve", description: "OG - Notreserve", x: 1, y: 0, width: 1, height: 2 },
  ];

  for (const sub of ogSubs) {
    await prisma.storageLocation.create({
      data: { ...sub, parentId: og.id, color: "#f59e0b" },
    });
  }

  // ==========================================
  // Create product variants (~20 products)
  // ==========================================
  console.log("📦 Creating product variants...");

  const products = [
    // Feuermaxx line
    { name: "Feuermaxx 3kg", code: "FM3", color: "#ef4444" },
    { name: "Feuermaxx 2kg", code: "FM2", color: "#ef4444" },
    { name: "Feuermaxx 1kg", code: "FM1", color: "#ef4444" },
    // Landi line
    { name: "Landi 2kg", code: "L2", color: "#22c55e" },
    { name: "Landi 1.5kg", code: "L15", color: "#22c55e" },
    { name: "Landi 1kg", code: "L1", color: "#22c55e" },
    // Hellson line
    { name: "Hellson 600g", code: "H600", color: "#3b82f6" },
    { name: "Hellson 400g", code: "H400", color: "#3b82f6" },
    { name: "Hellson 200g", code: "H200", color: "#3b82f6" },
    // Jumbo line
    { name: "Jumbo 5kg", code: "J5", color: "#8b5cf6" },
    { name: "Jumbo 3kg", code: "J3", color: "#8b5cf6" },
    // Eco line
    { name: "Eco Starter 2kg", code: "ES2", color: "#10b981" },
    { name: "Eco Starter 1kg", code: "ES1", color: "#10b981" },
    // Profi line
    { name: "Profi 4kg", code: "P4", color: "#f97316" },
    { name: "Profi 2.5kg", code: "P25", color: "#f97316" },
    // Special products
    { name: "Kamin-Set Premium", code: "KSP", color: "#ec4899" },
    { name: "Grillanzünder Würfel", code: "GAW", color: "#06b6d4" },
    { name: "Holzwolle natur", code: "HWN", color: "#84cc16" },
    { name: "Wachs-Rollen", code: "WR", color: "#eab308" },
    { name: "Outdoor Mix", code: "OM", color: "#64748b" },
  ];

  for (const prod of products) {
    await prisma.productVariant.create({ data: prod });
  }

  console.log("✅ Seeding complete!");
  console.log(`   - ${5} main locations`);
  console.log(`   - ${ugSubs.length + egSubs.length + ogSubs.length} sub-locations`);
  console.log(`   - ${products.length} product variants`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
