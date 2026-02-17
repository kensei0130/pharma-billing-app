
import { db } from "./db";
import { drugs } from "./db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

const projectDir = process.cwd();
dotenv.config({ path: projectDir + "/.env" });

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Unset");

async function main() {
    console.log("Verifying allowComment persistence...");

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
