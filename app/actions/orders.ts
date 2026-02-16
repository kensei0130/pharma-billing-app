"use server";

import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

type CartItem = {
    drugId: number;
    quantity: number;
};

export async function createOrder(items: CartItem[], orderType: "臨時" | "定時" = "臨時", scheduledDate?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "認証されていません" };
    }

    if (items.length === 0) {
        return { success: false, message: "薬品が選択されていません" };
    }

    if (orderType === "定時" && !scheduledDate) {
        return { success: false, message: "定期請求の場合は払出予定日を選択してください" };
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
            reason: "アプリからの請求",
            requestId: requestId,
            orderDate: now.toISOString(),
            scheduledDate: scheduledDate || null, // Periodic date
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

export async function updateOrder(orderId: number, items: CartItem[], orderType: "臨時" | "定時", scheduledDate?: string) {
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
            });
        }

        revalidatePath("/ward");
        return { success: true, message: "請求を更新しました" };

    } catch (e) {
        console.error(e);
        return { success: false, message: "更新に失敗しました" };
    }
}
