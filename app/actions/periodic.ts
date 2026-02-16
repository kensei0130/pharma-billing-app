"use server";

import { db } from "@/db";
import { orders, wards, orderItems, drugs, systemSettings } from "@/db/schema";
import { eq, and, desc, sql, inArray, gte, lte } from "drizzle-orm";
import { getPeriodicSettings } from "./settings";
import { getNextPayoutDates, getDeadline, isDeadlinePassed } from "@/lib/date-utils";
import { auth } from "@/auth";

export async function getPeriodicCycles(startDate?: string, endDate?: string) {
    const { payoutDayOfWeek, deadlineDaysBefore } = await getPeriodicSettings();

    // Default range if not provided: Show recent past (4 weeks) and future (8 weeks)
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth() - 1, 1); // Default: 1 month ago
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 3, 1); // Default: 3 months future

    // 1. Get distinct scheduled dates from existing orders within range
    const existingDateCondition = and(
        eq(orders.type, "定時"),
        gte(orders.scheduledDate, start.toISOString()),
        lte(orders.scheduledDate, end.toISOString())
    );

    const existingDates = await db
        .selectDistinct({ scheduledDate: orders.scheduledDate })
        .from(orders)
        .where(existingDateCondition)
        .orderBy(desc(orders.scheduledDate));

    // 2. Generate generic dates within range
    const generatedDates: Date[] = [];

    // Logic to find first payout date on or after `start`
    let requestDate = new Date(start);
    requestDate.setHours(0, 0, 0, 0);

    let diff = payoutDayOfWeek - requestDate.getDay();
    if (diff < 0) diff += 7;
    requestDate.setDate(requestDate.getDate() + diff); // First payout date

    while (requestDate <= end) {
        generatedDates.push(new Date(requestDate));
        requestDate.setDate(requestDate.getDate() + 7);
    }

    // Merge
    const cyclesMap = new Map<string, {
        date: string;
        isUpcoming: boolean;
        orderCount: number;
        status: string
    }>();

    // Add generated defaults
    generatedDates.forEach(d => {
        const dateStr = d.toISOString();
        cyclesMap.set(dateStr, {
            date: dateStr,
            isUpcoming: true,
            orderCount: 0,
            status: isDeadlinePassed(d, deadlineDaysBefore) ? "締切後" : "受付中"
        });
    });

    // Merge existing order counts
    for (const record of existingDates) {
        if (!record.scheduledDate) continue;

        // Count orders for this date
        const countRes = await db
            .select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(and(eq(orders.type, "定時"), eq(orders.scheduledDate, record.scheduledDate)));

        const count = countRes[0].count;

        if (cyclesMap.has(record.scheduledDate)) {
            const cycle = cyclesMap.get(record.scheduledDate)!;
            cycle.orderCount = count;
        } else {
            cyclesMap.set(record.scheduledDate, {
                date: record.scheduledDate,
                isUpcoming: new Date(record.scheduledDate) >= new Date(),
                orderCount: count,
                status: "過去の請求"
            });
        }
    }

    return Array.from(cyclesMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPeriodicOrdersByDate(dateStr: string) {
    // Fetch orders for this specific Periodic Cycle
    return await db.query.orders.findMany({
        where: and(
            eq(orders.type, "定時"),
            eq(orders.scheduledDate, dateStr)
        ),
        with: {
            ward: true,
            items: {
                with: {
                    drug: true
                }
            }
        },
        orderBy: [desc(orders.orderDate)]
    });
}

export async function bulkApproveCycle(dateStr: string) {
    const session = await auth();
    if (session?.user?.role !== "admin") return { success: false, message: "権限がありません" };

    try {
        // 1. Get all pending orders for this date
        const targetOrders = await db.select().from(orders).where(and(
            eq(orders.type, "定時"),
            eq(orders.scheduledDate, dateStr),
            eq(orders.status, "承認待ち") // Only approve pending ones
        ));

        if (targetOrders.length === 0) {
            return { success: true, message: "承認対象のオーダーはありません" };
        }

        const orderIds = targetOrders.map(o => o.id);

        // 2. Approve all items in these orders
        // SQLite doesn't support complex joins in update easily with Drizzle, so we iterate or use IN
        // Approving items: set approvedQuantity = quantity, status = "承認済み"

        // We need to be careful: orderItems doesn't have a direct "quantity" to copy from in a simple UPDATE statement
        // unless we use a subquery or raw SQL. 
        // Drizzle might support: .set({ approvedQuantity: orderItems.quantity }) ?
        // Let's try to update items blindly where orderId IN orderIds.

        // Actually, to set approvedQuantity = quantity, we need reference to the column.
        // Drizzle: .set({ approvedQuantity: orderItems.quantity }) works?

        await db.update(orderItems)
            .set({
                status: "承認済み",
                approvedQuantity: sql`${orderItems.quantity}`
            })
            .where(inArray(orderItems.orderId, orderIds));

        // 3. Update Orders status
        await db.update(orders)
            .set({
                status: "承認済み",
                approvedBy: session.user.name,
                approvedDate: new Date().toISOString()
            })
            .where(inArray(orders.id, orderIds));

        return { success: true, message: `${targetOrders.length}件のオーダーを一括承認しました` };
    } catch (e) {
        console.error(e);
        return { success: false, message: "一括承認中にエラーが発生しました" };
    }
}
