
import { db } from "./db";
import { orders, periodicEvents } from "./db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { toLocalISOString } from "./lib/date-utils";

async function migrate() {
    console.log("Starting migration...");

    // 1. Find orders with scheduledDate but no periodicEventId
    const targetOrders = await db.select({
        id: orders.id,
        scheduledDate: orders.scheduledDate
    }).from(orders).where(
        and(
            eq(orders.type, "定時"),
            isNull(orders.periodicEventId)
        )
    );

    console.log(`Found ${targetOrders.length} orders to migrate.`);
    if (targetOrders.length === 0) return;

    // 2. Map logical dates to Events
    // Date string might be messy ("YYYY-MM-DD" or "YYYY-MM-DDT...")

    for (const order of targetOrders) {
        if (!order.scheduledDate) continue;

        // Normalize date (Attempt to extract YYYY-MM-DD)
        const dateStr = order.scheduledDate.split('T')[0];

        // Find or Create Event
        let event = await db.query.periodicEvents.findFirst({
            where: eq(periodicEvents.payoutDate, dateStr)
        });

        if (!event) {
            console.log(`Creating event for date: ${dateStr}`);
            // Create event (Assuming deadline is 2 days before, purely for migration)
            const d = new Date(dateStr);
            const deadline = new Date(d);
            deadline.setDate(d.getDate() - 2);
            deadline.setHours(23, 59, 59);

            const res = await db.insert(periodicEvents).values({
                payoutDate: dateStr,
                deadline: deadline.toISOString(),
                status: "closed" // Old cycles are closed
            }).returning();
            event = res[0];
        }

        // Update Order
        await db.update(orders)
            .set({ periodicEventId: event.id })
            .where(eq(orders.id, order.id));
    }

    console.log("Migration complete.");
}

migrate();
