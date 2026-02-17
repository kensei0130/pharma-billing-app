
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    console.log("Loading environment and verifying allowComment persistence...");

    // Dynamic imports to ensure env is loaded first
    const { db } = await import("./db");
    const { drugs } = await import("./db/schema");
    const { eq } = await import("drizzle-orm");

    // 1. Create a test drug
    const testName = "TEST_DRUG_" + Date.now();
    const result = await db.insert(drugs).values({
        name: testName,
        unit: "T",
        allowComment: true,
        isInactive: false
    }).returning();

    const newDrug = result[0];
    console.log(`Created drug ID: ${newDrug.id}, Name: ${newDrug.name}, AllowComment: ${newDrug.allowComment}`);

    if (newDrug.allowComment !== true) {
        console.error("FAILED: Created drug does not have allowComment=true");
        process.exit(1);
    }

    // 2. Update to false
    await db.update(drugs).set({ allowComment: false }).where(eq(drugs.id, newDrug.id));
    const updatedDrug1 = await db.query.drugs.findFirst({ where: eq(drugs.id, newDrug.id) });
    console.log(`Updated to false: ${updatedDrug1?.allowComment}`);

    if (updatedDrug1?.allowComment !== false) {
        console.error("FAILED: Failed to update to false");
        process.exit(1);
    }

    // 3. Update to true
    await db.update(drugs).set({ allowComment: true }).where(eq(drugs.id, newDrug.id));
    const updatedDrug2 = await db.query.drugs.findFirst({ where: eq(drugs.id, newDrug.id) });
    console.log(`Updated to true: ${updatedDrug2?.allowComment}`);

    if (updatedDrug2?.allowComment !== true) {
        console.error("FAILED: Failed to update to true");
        process.exit(1);
    }

    // Cleanup
    await db.delete(drugs).where(eq(drugs.id, newDrug.id));
    console.log("SUCCESS: Backend persistence verified.");
}

main().catch(console.error).finally(() => process.exit(0));
