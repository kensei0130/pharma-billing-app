
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    console.log("Verifying return request feature...");

    // Dynamic imports
    const { db } = await import("./db");
    const { orders } = await import("./db/schema");
    const { eq } = await import("drizzle-orm");

    // 1. Get a test drug and ward
    const ward = await db.query.wards.findFirst();

    if (!ward) {
        console.error("No wards found");
        process.exit(1);
    }

    // 2. Create Order with Type "返却"
    console.log(`Creating order with type: 返却`);

    const [newOrder] = await db.insert(orders).values({
        wardId: ward.id,
        type: "返却", // Test new enum value
        status: "承認待ち",
        reason: "Verification Test",
        orderDate: new Date().toISOString(),
    }).returning();

    console.log(`Created Order ID: ${newOrder.id}`);

    // 3. Verify Fetch
    const fetchedOrder = await db.query.orders.findFirst({
        where: eq(orders.id, newOrder.id)
    });

    console.log(`Fetched Type: ${fetchedOrder?.type}`);

    if (fetchedOrder?.type !== "返却") {
        console.error("FAILED: Order type not saved correctly");
        await db.delete(orders).where(eq(orders.id, newOrder.id));
        process.exit(1);
    }

    console.log("SUCCESS: Return Request type is working in DB.");

    // Cleanup
    await db.delete(orders).where(eq(orders.id, newOrder.id));
}

main().catch(console.error).finally(() => process.exit(0));
