"use server";

import { db } from "@/db";
import { orders, wards, orderItems, drugs, systemSettings, periodicEvents } from "@/db/schema";
import { eq, and, desc, sql, inArray, gte, lte, like } from "drizzle-orm";
import { getPeriodicSettings } from "./settings";
import { getNextPayoutDates, getDeadline, isDeadlinePassed } from "@/lib/date-utils";
import { auth } from "@/auth";

export async function getPeriodicCycles(startDate?: string, endDate?: string) {
    const { payoutDayOfWeek, deadlineDaysBefore } = await getPeriodicSettings();

    // Default range if not provided: Show recent past (4 weeks) and future (8 weeks)
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(); // Default: Today
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 3, 1); // Default: 3 months future

    // 1. Get distinct scheduled dates from existing orders within range
    // Convert dates to YYYY-MM-DD string for text comparison
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    // For end date comparison, we want to include the entire day, so we compare up to the very end of that day string wise
    // or just append a high time value if comparing strings against ISO strings.
    // T23:59:59.999Z is safer to capture anything on that day.
    const endStrInclusive = endStr + "T23:59:59.999Z";

    const existingDateCondition = and(
        eq(orders.type, "定時"),
        gte(orders.scheduledDate, startStr),
        lte(orders.scheduledDate, endStrInclusive)
    );

    const existingDates = await db
        .selectDistinct({ scheduledDate: orders.scheduledDate })
        .from(orders)
        .where(existingDateCondition)
        .orderBy(desc(orders.scheduledDate));

    // 2. Generate generic dates within range
    const generatedDates: Date[] = [];

    // Logic to find first payout date on or after `start`
    // Ensure we start from the correct date boundary
    let requestDate = new Date(startStr);

    // Normalize time to avoid timezone issues when adding days
    requestDate.setHours(0, 0, 0, 0);

    let diff = payoutDayOfWeek - requestDate.getDay();
    if (diff < 0) diff += 7;
    requestDate.setDate(requestDate.getDate() + diff); // First payout date

    const endDateObj = new Date(endStr);
    endDateObj.setHours(23, 59, 59, 999);

    while (requestDate <= endDateObj) {
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
        // Use local YYYY-MM-DD to match scheduledDate format
        // d is created from new Date(YYYY-MM-DD) so it should be local midnight (or UTC midnight depending on env, but consistent)
        // To be safe, format as YYYY-MM-DD
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${d.getFullYear()}-${month}-${day}`;

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

        // Normalize DB Date to YYYY-MM-DD to match generated keys
        // DB might store as "YYYY-MM-DD" or "YYYY-MM-DDT..."
        const recordDateStr = new Date(record.scheduledDate).toISOString().split('T')[0];

        // Count orders for this date
        // Note: usage of 'record.scheduledDate' in query must match DB value, but key in map is normalized
        const countRes = await db
            .select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(and(eq(orders.type, "定時"), eq(orders.scheduledDate, record.scheduledDate)));

        const count = countRes[0].count;

        if (cyclesMap.has(recordDateStr)) {
            const cycle = cyclesMap.get(recordDateStr)!;
            cycle.orderCount = count;
            // If it exists in map (generated), it is "upcoming" or "active" based on logic.
            // But if it has orders, we might want to ensure status reflects that?
            // "受付中" is default for generated.
        } else {
            // User requested that existing orders be treated as "Accepted" (active) rather than past
            // Or simple logic: if it has orders, it's effectively an active record until closed/archived?
            // "過去の請求ではなく、受付中としてください"
            cyclesMap.set(recordDateStr, {
                date: recordDateStr,
                isUpcoming: new Date(recordDateStr) >= new Date(),
                orderCount: count,
                status: "受付中" // Always show as Accepting if it was found in orders within range
            });
        }
    }
    // Convert map to array and sort by date desc
    return Array.from(cyclesMap.values()).sort((a, b) => b.date.localeCompare(a.date));
}

// NEW: Fetch cycles from periodic_events master table
export async function getPeriodicCyclesFromEvents() {
    // Get all events (or filter by date range if needed)
    // For now get all and sort desc
    const events = await db.query.periodicEvents.findMany({
        orderBy: [desc(periodicEvents.payoutDate)],
        with: {
            orders: true // To count orders
        }
    });

    return events.map(event => {
        // Count active orders (not cancelled) - depends on your logic
        // orders relation includes all orders.
        const activeOrders = event.orders.filter(o => o.type === "定時");
        const orderCount = activeOrders.length;

        const pendingCount = activeOrders.filter(o => o.status === "承認待ち").length;
        const partialCount = activeOrders.filter(o => o.status === "部分承認").length;
        const approvedCount = activeOrders.filter(o => o.status === "承認済み").length;

        return {
            id: event.id,
            date: event.payoutDate,
            deadline: event.deadline,
            isUpcoming: new Date(event.payoutDate) >= new Date(),
            orderCount: orderCount,
            pendingCount,
            partialCount,
            approvedCount,
            status: event.status === "open" ? (new Date() > new Date(event.deadline) ? "締切後" : "受付中") : event.status
        };
    });
}

// Deprecated: getPeriodicCycles (Original) - kept for reference or safe deletion later

// NEW: Fetch orders by Event ID
export async function getPeriodicOrdersByEventId(eventId: number) {
    const rawOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.periodicEventId, eventId)
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

    return rawOrders.map(order => ({
        ...order,
        items: order.items.map(item => ({
            ...item,
            drugName: item.drug.name,
            drugUnit: item.drug.unit,
        }))
    }));
}

// Helper to get normalized date condition
function getDateCondition(dateStr: string) {
    // Matches YYYY-MM-DD or YYYY-MM-DDT...
    return like(orders.scheduledDate, `${dateStr}%`);
}

export async function getPeriodicOrdersByDate(dateStr: string) {
    // Fetch orders for this specific Periodic Cycle
    // Use LIKE to match date string regardless of time component
    const rawOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.type, "定時"),
            getDateCondition(dateStr)
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

    // Remap to flatten items for ApprovalOrderDetail compatibility
    return rawOrders.map(order => ({
        ...order,
        items: order.items.map(item => ({
            ...item,
            drugName: item.drug.name,
            drugUnit: item.drug.unit,
            // drug object is also kept if needed, but existing comp uses drugName
        }))
    }));
}

export async function bulkApproveCycle(eventId: number) {
    const session = await auth();
    if (session?.user?.role !== "admin") return { success: false, message: "権限がありません" };

    try {
        // 1. Get all pending orders for this event
        const targetOrders = await db.select().from(orders).where(and(
            eq(orders.periodicEventId, eventId),
            eq(orders.status, "承認待ち") // Only approve pending ones
        ));

        if (targetOrders.length === 0) {
            return { success: true, message: "承認対象のオーダーはありません" };
        }

        const orderIds = targetOrders.map(o => o.id);

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
