
import { config } from "dotenv";
import path from "path";

// 1. Load Environment Variables FIRST
const envPath = path.resolve(process.cwd(), ".env");
console.log("📂 Loading .env from:", envPath);
config({ path: envPath });

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is missing from environment.");
    process.exit(1);
}

console.log("🔗 Connecting to DB...");

async function main() {
    // 2. Dynamic Import (prevents hoisting issues)
    const { db } = await import("../db");
    const { periodicEvents, orders } = await import("../db/schema");
    const { isNotNull } = await import("drizzle-orm");

    console.log("🧹 Resetting Periodic Data...");

    try {
        // 3. Unlink orders
        console.log("   - Detaching orders from periodic events...");
        await db.update(orders)
            .set({ periodicEventId: null })
            .where(isNotNull(orders.periodicEventId));

        // 4. Delete events
        console.log("   - Deleting periodic events...");
        await db.delete(periodicEvents);

        console.log("✅ Done! Periodic events have been cleared.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Error:", e);
        process.exit(1);
    }
}

main();
