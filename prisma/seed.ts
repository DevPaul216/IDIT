import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (order matters due to foreign keys)
  await prisma.inventoryLog.deleteMany();
  await prisma.currentInventory.deleteMany();
  await prisma.storageLocation.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.user.deleteMany();

  // ==========================================
  // Create users with PINs
  // ==========================================
  console.log("👤 Creating users...");

  await prisma.user.createMany({
    data: [
      { name: "Paul", pin: "1111" },
      { name: "Dieter", pin: "2222" },
      { name: "David", pin: "3333" },
      { name: "Gast", pin: "0000" },
    ],
  });

  // ==========================================
  // Create parent storage locations (floors/buildings)
  // ==========================================
  console.log("📍 Creating main storage areas...");

  const ug = await prisma.storageLocation.create({
    data: { name: "UG", description: "Untergeschoss", x: 0, y: 0, width: 160, height: 160, color: "#6366f1" },
  });

  const eg = await prisma.storageLocation.create({
    data: { name: "EG", description: "Erdgeschoss", x: 240, y: 0, width: 160, height: 160, color: "#22c55e" },
  });

  const og = await prisma.storageLocation.create({
    data: { name: "OG", description: "Obergeschoss", x: 480, y: 0, width: 160, height: 160, color: "#f59e0b" },
  });

  const halle204 = await prisma.storageLocation.create({
    data: { name: "Halle 204", description: "Lagerhalle 204", x: 0, y: 240, width: 240, height: 160, color: "#ec4899" },
  });

  const halle205 = await prisma.storageLocation.create({
    data: { name: "Halle 205", description: "Lagerhalle 205", x: 320, y: 240, width: 240, height: 160, color: "#14b8a6" },
  });

  // ==========================================
  // Create sub-locations within each area
  // ==========================================
  console.log("📍 Creating sub-locations...");

  // UG sub-locations
  const ugSubs = [
    { name: "Wachsraum", description: "UG - Wachsraum", x: 0, y: 0, width: 150, height: 120 },
    { name: "Zwischenlager Produktion", description: "UG - Zwischenlager", x: 160, y: 0, width: 150, height: 120 },
    { name: "Fertiglager", description: "UG - Fertiglager", x: 0, y: 130, width: 150, height: 120 },
    { name: "Holzwollnische", description: "UG - Holzwollnische", x: 160, y: 130, width: 150, height: 120 },
  ];

  for (const sub of ugSubs) {
    await prisma.storageLocation.create({
      data: { ...sub, parentId: ug.id, color: "#6366f1" },
    });
  }

  // EG sub-locations
  const egSubs = [
    { name: "MST", description: "EG - MST", x: 0, y: 0, width: 150, height: 250 },
    { name: "Oberndorfer", description: "EG - Oberndorfer", x: 160, y: 0, width: 150, height: 250 },
  ];

  for (const sub of egSubs) {
    await prisma.storageLocation.create({
      data: { ...sub, parentId: eg.id, color: "#22c55e" },
    });
  }

  // OG sub-locations
  const ogSubs = [
    { name: "Schachtelware", description: "OG - Schachtelware", x: 0, y: 0, width: 150, height: 250 },
    { name: "Notreserve", description: "OG - Notreserve", x: 160, y: 0, width: 150, height: 250 },
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
    // ==========================================
    // RAW MATERIALS (Rohmaterial) - with resource weights
    // ==========================================
    { name: "Seile mit Wachs", code: "SMW", category: "raw", color: "#eab308", resourceWeight: 25 },
    { name: "Seile ohne Wachs", code: "SOW", category: "raw", color: "#a3a3a3", resourceWeight: 25 },
    { name: "Stangen", code: "STG", category: "raw", color: "#78716c", resourceWeight: 450 },
    { name: "Ballen", code: "BAL", category: "raw", color: "#84cc16", resourceWeight: 350 },
    { name: "Wachs", code: "WAX", category: "raw", color: "#fbbf24", resourceWeight: 200 },
    { name: "Holzwolle natur", code: "HWN", category: "raw", color: "#a3e635", resourceWeight: 15 },

    // ==========================================
    // FINISHED PRODUCTS (Fertigprodukte)
    // ==========================================
    // Feuermaxx line
    { name: "Feuermaxx 3kg", code: "FM3", category: "finished", color: "#ef4444" },
    { name: "Feuermaxx 2kg", code: "FM2", category: "finished", color: "#ef4444" },
    { name: "Feuermaxx 1kg", code: "FM1", category: "finished", color: "#ef4444" },
    // Landi line
    { name: "Landi 2kg", code: "L2", category: "finished", color: "#22c55e" },
    { name: "Landi 1.5kg", code: "L15", category: "finished", color: "#22c55e" },
    { name: "Landi 1kg", code: "L1", category: "finished", color: "#22c55e" },
    // Hellson line
    { name: "Hellson 600g", code: "H600", category: "finished", color: "#3b82f6" },
    { name: "Hellson 400g", code: "H400", category: "finished", color: "#3b82f6" },
    { name: "Hellson 200g", code: "H200", category: "finished", color: "#3b82f6" },
    // Jumbo line
    { name: "Jumbo 5kg", code: "J5", category: "finished", color: "#8b5cf6" },
    { name: "Jumbo 3kg", code: "J3", category: "finished", color: "#8b5cf6" },
    // Eco line
    { name: "Eco Starter 2kg", code: "ES2", category: "finished", color: "#10b981" },
    { name: "Eco Starter 1kg", code: "ES1", category: "finished", color: "#10b981" },
    // Profi line
    { name: "Profi 4kg", code: "P4", category: "finished", color: "#f97316" },
    { name: "Profi 2.5kg", code: "P25", category: "finished", color: "#f97316" },
    // Special products
    { name: "Kamin-Set Premium", code: "KSP", category: "finished", color: "#ec4899" },
    { name: "Grillanzünder Würfel", code: "GAW", category: "finished", color: "#06b6d4" },
    { name: "Outdoor Mix", code: "OM", category: "finished", color: "#64748b" },

    // ==========================================
    // PACKAGING (Verpackungsmaterial)
    // ==========================================
    { name: "Schachtel klein", code: "SK", category: "packaging", color: "#d4a574" },
    { name: "Schachtel mittel", code: "SM", category: "packaging", color: "#c4956a" },
    { name: "Schachtel gross", code: "SG", category: "packaging", color: "#b48560" },
    { name: "Folie transparent", code: "FT", category: "packaging", color: "#94a3b8" },
    { name: "Folie bedruckt", code: "FB", category: "packaging", color: "#64748b" },
    { name: "Säcke klein", code: "SAK", category: "packaging", color: "#a8a29e" },
    { name: "Säcke gross", code: "SAG", category: "packaging", color: "#78716c" },
    { name: "Palette EUR", code: "PEUR", category: "packaging", color: "#92400e" },
  ];

  const createdProducts = [];
  for (const prod of products) {
    const created = await prisma.productVariant.create({ data: prod });
    createdProducts.push(created);
  }

  // ==========================================
  // Create example inventory data (DEMO DATA - unrealistic dates)
  // ==========================================
  console.log("📊 Creating example inventory data (DEMO)...");

  // Get all created locations for reference
  const allLocations = await prisma.storageLocation.findMany();
  const subLocations = allLocations.filter(l => l.parentId !== null);
  const paul = await prisma.user.findFirst({ where: { name: "Paul" } });
  const dieter = await prisma.user.findFirst({ where: { name: "Dieter" } });

  if (paul && dieter && subLocations.length > 0) {
    // Demo dates - clearly fake (year 2000)
    const demoDate1 = new Date("2000-01-15T10:30:00Z");
    const demoDate2 = new Date("2000-01-16T14:45:00Z");
    const demoDate3 = new Date("2000-01-17T09:15:00Z");

    // Create some current inventory entries
    const inventoryEntries = [
      { locationId: subLocations[0].id, productId: createdProducts[0].id, quantity: 12, date: demoDate3, userId: paul.id },
      { locationId: subLocations[0].id, productId: createdProducts[1].id, quantity: 8, date: demoDate3, userId: paul.id },
      { locationId: subLocations[0].id, productId: createdProducts[3].id, quantity: 5, date: demoDate3, userId: paul.id },
      { locationId: subLocations[1].id, productId: createdProducts[0].id, quantity: 20, date: demoDate2, userId: dieter.id },
      { locationId: subLocations[1].id, productId: createdProducts[4].id, quantity: 15, date: demoDate2, userId: dieter.id },
      { locationId: subLocations[2].id, productId: createdProducts[6].id, quantity: 30, date: demoDate1, userId: paul.id },
      { locationId: subLocations[2].id, productId: createdProducts[7].id, quantity: 25, date: demoDate1, userId: paul.id },
      { locationId: subLocations[3].id, productId: createdProducts[9].id, quantity: 10, date: demoDate2, userId: dieter.id },
    ];

    for (const entry of inventoryEntries) {
      await prisma.currentInventory.create({
        data: {
          locationId: entry.locationId,
          productId: entry.productId,
          quantity: entry.quantity,
          lastCheckedAt: entry.date,
          lastCheckedById: entry.userId,
        },
      });

      // Also create log entry
      await prisma.inventoryLog.create({
        data: {
          locationId: entry.locationId,
          productId: entry.productId,
          previousQty: null,
          newQty: entry.quantity,
          changedById: entry.userId,
          changedAt: entry.date,
        },
      });
    }

    // Add some "change" logs to show history
    await prisma.inventoryLog.create({
      data: {
        locationId: subLocations[0].id,
        productId: createdProducts[0].id,
        previousQty: 8,
        newQty: 12,
        changedById: paul.id,
        changedAt: demoDate3,
      },
    });

    await prisma.inventoryLog.create({
      data: {
        locationId: subLocations[1].id,
        productId: createdProducts[0].id,
        previousQty: 25,
        newQty: 20,
        changedById: dieter.id,
        changedAt: demoDate2,
      },
    });
  }

  console.log("✅ Seeding complete!");
  console.log(`   - 4 users`);
  console.log(`   - ${5} main locations`);
  console.log(`   - ${ugSubs.length + egSubs.length + ogSubs.length} sub-locations`);
  console.log(`   - ${products.length} product variants`);
  console.log(`   - Demo inventory data (dates from year 2000)`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
