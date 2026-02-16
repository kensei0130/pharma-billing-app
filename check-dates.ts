
import { db } from "./db";
import { orders } from "./db/schema";
import { sql } from "drizzle-orm";

async function checkDates() {
    const results = await db.select({
        id: orders.id,
        scheduledDate: orders.scheduledDate,
        type: orders.type
    }).from(orders).limit(20);

    console.log("Current Order Dates:");
    results.forEach(r => console.log(r));
}

checkDates();
