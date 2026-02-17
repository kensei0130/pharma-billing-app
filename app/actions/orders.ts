"use server";

import { getMonitorSettings } from "@/app/actions/settings";

import { db } from "@/db";
import { orders, orderItems, periodicEvents, systemSettings } from "@/db/schema";
import { eq, and, asc, desc, inArray, gte, or } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { getNextPayoutDate, toLocalISOString, getDeadline, getPreviousPayoutDate } from "@/lib/date-utils";

type CartItem = {
    drugId: number;
    quantity: number;
    comment?: string;
};

export async function createOrder(
    items: CartItem[],
    orderType: "臨時" | "定時" | "返却" = "臨時",
    scheduledDate?: string,
    periodicEventId?: number,
    isException: boolean = false,
    reason?: string // Added reason parameter
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "認証されていません" };
    }

    if (items.length === 0) {
        return { success: false, message: "薬品が選択されていません" };
    }

    let finalPeriodicEventId = periodicEventId;
    let finalScheduledDate = scheduledDate;

    // Automatic Cycle Logic for Periodic Orders
    if (orderType === "定時") {
        try {
            // 1. Fetch System Settings
            const settings = await db.select().from(systemSettings);
            const payoutDay = parseInt(settings.find(s => s.key === "payout_day_of_week")?.value || "4"); // Default Thu
            const deadlineDays = parseInt(settings.find(s => s.key === "deadline_days_before")?.value || "2"); // Default 2 days

            // 2. Calculate Target Date
            let targetDate: Date;
            if (isException) {
                // Exception mode: Use previous payout date (deadline passed)
                targetDate = getPreviousPayoutDate(new Date(), payoutDay, deadlineDays);
            } else {
                // Standard mode: Use next valid payout date
                targetDate = getNextPayoutDate(new Date(), payoutDay, deadlineDays);
            }

            const targetDateStr = toLocalISOString(targetDate);

            // 3. Find or Create Event
            const existingEvent = await db.query.periodicEvents.findFirst({
                where: eq(periodicEvents.payoutDate, targetDateStr)
            });

            if (existingEvent) {
                finalPeriodicEventId = existingEvent.id;
            } else {
                // Create new event on the fly
                // For exception billing, the deadline might have already passed.
                // We typically set the deadline based on the payout date - daysBefore.
                const deadlineDate = getDeadline(targetDate, deadlineDays);
                const [newEvent] = await db.insert(periodicEvents).values({
                    payoutDate: targetDateStr,
                    deadline: deadlineDate.toISOString(),
                    status: "open" // Or should we default to closed if exception? Ideally 'open' so others can join if still technically open?
                    // Actually if deadline passed, it will show as passed in UI. Status 'open' just means "not finalized by admin".
                }).returning();
                finalPeriodicEventId = newEvent.id;
            }

            finalScheduledDate = targetDateStr;

        } catch (e) {
            console.error("Auto-assign cycle error:", e);
            return { success: false, message: "定期請求の自動割り振りに失敗しました" };
        }
    }

    try {
        // Generate Request ID (Simple logic: Date-Time based or Random for now)
        // Production would check existing IDs for the day
        const now = new Date();
        const dateStr = `${now.getDate()}`;
        const requestId = `${dateStr}-${Math.floor(Math.random() * 1000)}`;

        // 1. Create Order
        const [newOrder] = await db.insert(orders).values({
            wardId: session.user.id,
            type: orderType,
            status: "承認待ち",
            reason: reason || (isException ? "期限切れ例外請求" : null), // Only use default for exception
            requestId: requestId,
            orderDate: now.toISOString(),
            scheduledDate: finalScheduledDate || null, // Periodic date
            periodicEventId: finalPeriodicEventId || null, // FK
            weekStart: null,
        }).returning();

        // 2. Create Order Items
        for (const item of items) {
            await db.insert(orderItems).values({
                orderId: newOrder.id,
                drugId: item.drugId,
                quantity: item.quantity,
                status: "承認待ち",
                approvedQuantity: 0,
                rejectedQuantity: 0,
                comment: item.comment || null,
            });
        }

        revalidatePath("/ward");
        return { success: true, message: "請求を送信しました" };
    } catch (e) {
        console.error("Order Creation Error:", e);
        // Return detailed error in dev environment if needed, but simple for user
        return { success: false, message: "請求の作成に失敗しました。データベースの状態を確認してください。" };
    }
}

export async function cancelOrder(orderId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "認証されていません" };
    }

    try {
        // Verify ownership and status via a check (Assuming db.query is available or we select)
        const order = await db.query.orders.findFirst({
            where: and(
                eq(orders.id, orderId),
                eq(orders.wardId, session.user.id)
            )
        });

        if (!order) {
            return { success: false, message: "請求が見つかりません" };
        }

        if (order.status !== "承認待ち") {
            return { success: false, message: "既に処理が進んでいるためキャンセルできません" };
        }

        await db.delete(orders).where(eq(orders.id, orderId));

        revalidatePath("/ward");
        return { success: true, message: "請求を取り消しました" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "エラーが発生しました" };
    }
}

export async function getOrderDetails(orderId: number) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const order = await db.query.orders.findFirst({
        where: and(
            eq(orders.id, orderId),
            eq(orders.wardId, session.user.id)
        ),
        with: {
            items: {
                with: {
                    drug: true
                }
            }
        }
    });

    return order;
}

export async function getMonitorOrders() {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        return { unapproved: [], approved: [] };
    }

    const settings = await getMonitorSettings();
    const { targetType, dateRange, pendingDateRange } = settings;

    // Base query conditions
    const conditions = [
        eq(orders.isCancelled, false)
    ];

    // Filter by Type
    const selectedTypes = targetType.split(",");

    if (!selectedTypes.includes("all")) {
        // If not 'all', we construct an OR condition for the selected types
        const typeConditions = [];

        if (selectedTypes.includes("periodic")) typeConditions.push(eq(orders.type, "定時"));
        if (selectedTypes.includes("urgent")) typeConditions.push(eq(orders.type, "返却"));
        if (selectedTypes.includes("temporary")) typeConditions.push(eq(orders.type, "臨時"));

        if (typeConditions.length > 0) {
            // Wrapping in OR: (cancelled=false) AND (type=A OR type=B)
            // Drizzle 'or' takes varargs
            const orCondition = or(...typeConditions);
            if (orCondition) {
                conditions.push(orCondition);
            }
        }
    }

    // Date Calculation for "Approved" orders (limit range)
    // For "Unapproved", we usually want to see ALL pending items regardless of date, to avoid missing them.
    // So date range applies mostly to the "Approved" column to keep it clean.

    const now = new Date();
    const rangeStartDate = new Date();
    rangeStartDate.setDate(now.getDate() - dateRange);
    rangeStartDate.setHours(0, 0, 0, 0); // Start of that day

    // To implement date filtering safely with string dates, we can use simple string comparison if format is ISO.
    // DB Format: YYYY-MM-DD HH:mm:ss (sql`CURRENT_TIMESTAMP`)

    const rangeStartStr = rangeStartDate.toISOString().slice(0, 10); // YYYY-MM-DD

    // Date Calculation for "Pending" orders
    const pendingStartDate = new Date();
    // If pendingDateRange is 999 (All), we basically don't filter or filter very old.
    // Logic: if 999, don't add date condition.
    let pendingStartStr: string | null = null;
    if (pendingDateRange !== 999) {
        pendingStartDate.setDate(now.getDate() - pendingDateRange);
        pendingStartDate.setHours(0, 0, 0, 0);
        pendingStartStr = pendingStartDate.toISOString().slice(0, 10);
    }

    // Fetch Unapproved (Pending)
    // Status: "承認待ち" or "部分承認" ? usually "承認待ち" is the queue.
    const unapprovedConditions = [
        ...conditions,
        inArray(orders.status, ["承認待ち", "部分承認"])
    ];

    if (pendingStartStr) {
        unapprovedConditions.push(gte(orders.orderDate, pendingStartStr));
    }

    const unapprovedOrders = await db.query.orders.findMany({
        where: and(...unapprovedConditions),
        with: {
            ward: true,
            items: {
                with: {
                    drug: true
                }
            }
        },
        orderBy: [asc(orders.orderDate)] // Oldest first for handling
    });

    // Fetch Approved (Ready)
    const approvedConditions = [...conditions, eq(orders.status, "承認済み")];

    // Apply date filter for approved items
    // Since we store dates as strings, we might need comparison.
    // However, SQLite text comparison works for ISO/Standard formats.
    // orders.approvedDate is nullable, orders.orderDate is not.
    // We should filter by approvedDate if possible, or orderDate.
    // Let's use orderDate for now as a proxy if approvedDate isn't reliably set or for simplicity.
    // Actually, approved items should have approvedDate.
    // Let's try to filter by approvedDate >= rangeStartDate.

    // Format rangeStartDate to string YYYY-MM-DD
    // But our timestamps might be full strings.
    // Let's keep it simple: Fetch recent orders by orderDate for approved column.

    // We want orders where orderDate >= rangeStartStr

    // We want orders where orderDate >= rangeStartStr
    approvedConditions.push(gte(orders.orderDate, rangeStartStr));

    const approvedOrders = await db.query.orders.findMany({
        where: and(...approvedConditions),
        with: {
            ward: true,
            items: {
                with: {
                    drug: true
                }
            }
        },
        orderBy: [desc(orders.approvedDate), desc(orders.orderDate)] // Newest approved first
    });

    return { unapproved: unapprovedOrders, approved: approvedOrders };
}

export async function updateOrder(orderId: number, items: CartItem[], orderType: "臨時" | "定時" | "返却", scheduledDate?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "認証されていません" };
    }

    try {
        const order = await db.query.orders.findFirst({
            where: and(
                eq(orders.id, orderId),
                eq(orders.wardId, session.user.id),
                eq(orders.status, "承認待ち")
            )
        });

        if (!order) {
            return { success: false, message: "編集可能な請求が見つかりません" };
        }

        // Update Order Type
        await db.update(orders)
            .set({ type: orderType, orderDate: new Date().toISOString() })
            .where(eq(orders.id, orderId));

        // Re-create items
        await db.delete(orderItems).where(eq(orderItems.orderId, orderId));

        for (const item of items) {
            await db.insert(orderItems).values({
                orderId: orderId,
                drugId: item.drugId,
                quantity: item.quantity,
                status: "承認待ち",
                approvedQuantity: 0,
                rejectedQuantity: 0,
                comment: item.comment || null,
            });
        }

        revalidatePath("/ward");
        return { success: true, message: "請求を更新しました" };

    } catch (e) {
        console.error(e);
        return { success: false, message: "更新に失敗しました" };
    }
}
