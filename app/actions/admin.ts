"use server";

import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// Helper to check and update parent order status
async function checkAndUpdateOrderStatus(orderId: number, actorName: string) {
    // Get all items
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    const allApproved = items.every(i => i.status === "承認済み" || i.status === "却下"); // All resolved
    const hasPartial = items.some(i => i.status === "部分承認");
    const isAllRejected = items.every(i => i.status === "却下");

    let newStatus = "承認待ち";
    if (allApproved) {
        newStatus = isAllRejected ? "却下" : "承認済み";
    } else if (hasPartial) {
        // If some are partial (and not all done), the order itself is "部分承認" (Acting as "In Progress")
        newStatus = "部分承認";
    }

    // Only update if changed (optional check, but good for history if we tracked it)
    await db.update(orders)
        .set({
            status: newStatus as any,
            approvedBy: actorName,
            approvedDate: allApproved ? new Date().toISOString() : undefined // Only set date when fully done? Or update every time? Let's update date on last action.
        })
        .where(eq(orders.id, orderId));
}

export async function approveItem(itemId: number, quantity: number) {
    const session = await auth();
    if (session?.user?.role !== "admin") return { success: false, message: "Unauthorized" };

    const item = await db.query.orderItems.findFirst({
        where: eq(orderItems.id, itemId)
    });
    if (!item) return { success: false, message: "not found" };

    // Calculate new total approved
    // If status was Pending, previous approved is 0 (or whatever was set).
    // Logic: The UI sends the "Amount to Approve NOW".
    // So we ADD to existing.
    // WAIT: The UI currently sends the "New Value of the Input".
    // In "Pending" state, input defaults to `item.quantity`. User changes to 5. Input=5.
    // We want `approvedQuantity` = 5.
    // In "Partial" state (Quantity 10, Approved 5, Remaining 5). Input defaults to 5.
    // User keeps 5 and clicks Approve. Total Approved should be 5 + 5 = 10?
    // OR does the UI send the "Total Cumulative Approved"?
    // The UI `defaultValue` logic: `defaultValue={item.status === "承認済み" ? item.approvedQuantity : item.quantity}`
    // If Status is Partial, we should probably set defaultValue to `remaining`.
    // And treat the input as "Additional Amount".

    // Let's assume input is "Amount attempting to approve this transaction".

    let newApprovedTotal = (item.approvedQuantity || 0) + quantity;
    let newStatus = "承認済み";

    if (newApprovedTotal < item.quantity) {
        newStatus = "部分承認";
    } else if (newApprovedTotal > item.quantity) {
        // Cap at max?
        newApprovedTotal = item.quantity;
    }

    // 1. Update item
    const [updatedItem] = await db.update(orderItems)
        .set({
            status: newStatus as any,
            approvedQuantity: newApprovedTotal,
            rejectedQuantity: 0 // Reset rejected on new approval? Maybe. Or keep it?
            // If we are doing cumulative approval, we probably shouldn't imply rejection unless explicit.
            // But simplification: "Approve" focuses on valid quantity.
        })
        .where(eq(orderItems.id, itemId))
        .returning();

    // 2. Check parent order
    if (updatedItem) {
        await checkAndUpdateOrderStatus(updatedItem.orderId, session.user.name || "Admin");
    }

    revalidatePath("/admin");
    return { success: true };
}

export async function rejectItem(itemId: number) {
    const session = await auth();
    if (session?.user?.role !== "admin") return { success: false, message: "Unauthorized" };

    // 1. Update item
    const [updatedItem] = await db.update(orderItems)
        .set({
            status: "却下",
            approvedQuantity: 0,
            rejectedQuantity: 0
        })
        .where(eq(orderItems.id, itemId))
        .returning();

    // 2. Check parent order
    if (updatedItem) {
        await checkAndUpdateOrderStatus(updatedItem.orderId, session.user.name || "Admin");
    }

    revalidatePath("/admin");
    return { success: true };
}

export async function cancelItemApproval(itemId: number) {
    const session = await auth();
    if (session?.user?.role !== "admin") return { success: false, message: "Unauthorized" };

    // 1. Get current item to find orderId
    const item = await db.query.orderItems.findFirst({
        where: eq(orderItems.id, itemId)
    });

    if (!item) return { success: false, message: "Item not found" };

    // 2. Revert item
    await db.update(orderItems)
        .set({
            status: "承認待ち",
            approvedQuantity: 0, // Reset approved quantity? Or keep it? Usually reset makes sense for "Undo".
            rejectedQuantity: 0
        })
        .where(eq(orderItems.id, itemId));

    // 3. Revert parent order status if it was "Completed"
    // Ideally, we check if ANY item is now pending (which we just made one pending), so yes.
    await db.update(orders)
        .set({
            status: "承認待ち", // Or "Partial"? "承認待ち" is safer to ensure it gets reviewed again.
            // approvedBy: null, // Keep history or clear? Let's keep approvedBy as "Last touched by" or clear it. 
            // Clearing it might be better to indicate it's open again.
        })
        .where(eq(orders.id, item.orderId));

    revalidatePath("/admin");
    return { success: true };
}
