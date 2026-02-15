import { db } from "./index";
import { drugs, wardConstantDrugs, orders, orderItems, wards, constantSets } from "./schema";
import { eq, desc, and, inArray, like, gte, lte, sql } from "drizzle-orm";

export async function getDrugs() {
    return await db.select().from(drugs).where(eq(drugs.isInactive, false));
}

export async function getWardConstantDrugs(wardId: string) {
    // Join constantSets to get items filtered by wardId (returns flattened list with Set info)
    // Note: If multiple sets have same drug, it will appear multiple times.
    const results = await db
        .select({
            id: wardConstantDrugs.id,
            setId: wardConstantDrugs.setId,
            setName: constantSets.name,
            drugId: wardConstantDrugs.drugId,
            quantity: wardConstantDrugs.quantity,
            displayOrder: wardConstantDrugs.displayOrder, // Include in result
            name: drugs.name,
            unit: drugs.unit,
        })
        .from(wardConstantDrugs)
        .innerJoin(constantSets, eq(wardConstantDrugs.setId, constantSets.id))
        .innerJoin(drugs, eq(wardConstantDrugs.drugId, drugs.id))
        .where(eq(constantSets.wardId, wardId))
        .orderBy(wardConstantDrugs.displayOrder); // Sort by displayOrder

    // Cast setId to number since innerJoin guarantees it matches a set
    return results.map(r => ({
        ...r,
        setId: r.setId as number
    }));
}

export async function getConstantSets(wardId: string) {
    return await db.select().from(constantSets).where(eq(constantSets.wardId, wardId));
}

export async function getWardOrders(wardId: string) {
    const wardOrders = await db.query.orders.findMany({
        where: eq(orders.wardId, wardId),
        orderBy: [desc(orders.orderDate)],
        limit: 20,
        with: {
            items: {
                with: {
                    drug: true
                }
            }
        }
    });
    return wardOrders;
}

// Enhanced function for Admin Console
export async function getAdminOrders(filters?: {
    status?: string[];
    type?: string[];
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
}) {
    let conditions = [];

    if (filters?.status && filters.status.length > 0) {
        // @ts-ignore
        conditions.push(inArray(orders.status, filters.status));
    }
    if (filters?.type && filters.type.length > 0) {
        // @ts-ignore
        conditions.push(inArray(orders.type, filters.type));
    }

    if (filters?.startDate) {
        // String comparison works for ISO dates (YYYY-MM-DD...)
        conditions.push(gte(orders.orderDate, filters.startDate));
    }

    if (filters?.endDate) {
        // Append time to end of day for inclusive comparison if only date provided
        // Assuming input is YYYY-MM-DD, we want effectively <= YYYY-MM-DDT23:59:59
        // Or simple string compare: orderDate < 'YYYY-MM-(DD+1)'
        // Let's assume input is just the date string, so we match anything starting with it or before.
        // Safer: <= endDate + "T23:59:59"
        conditions.push(lte(orders.orderDate, `${filters.endDate}T23:59:59`));
    }

    const baseQuery = db
        .select({
            id: orders.id,
            wardName: wards.name,
            type: orders.type,
            status: orders.status,
            orderDate: orders.orderDate,
            reason: orders.reason,
            approvedBy: orders.approvedBy,
            approvedDate: orders.approvedDate,
        })
        .from(orders)
        .innerJoin(wards, eq(orders.wardId, wards.id));

    if (conditions.length > 0) {
        // @ts-ignore - formatting issue with array vs single
        baseQuery.where(and(...conditions));
    }

    return await baseQuery.orderBy(desc(orders.orderDate));
}

export async function getOrderStatusCounts() {
    // Aggregate counts by status
    const results = await db
        .select({
            status: orders.status,
            count: sql<number>`count(*)`
        })
        .from(orders)
        .groupBy(orders.status);

    // Convert to object for easier consumption
    const counts = {
        "承認待ち": 0,
        "部分承認": 0,
        "承認済み": 0,
        "却下": 0
    };

    results.forEach(r => {
        if (r.status in counts) {
            // @ts-ignore
            counts[r.status] = r.count;
        }
    });

    return counts;
}

export async function getPendingOrders() {
    return await getAdminOrders({ status: ["承認待ち"] });
}

export async function getHistoryOrders() {
    return await db
        .select({
            id: orders.id,
            wardName: wards.name,
            type: orders.type,
            status: orders.status,
            orderDate: orders.orderDate,
            approvedDate: orders.approvedDate,
            approvedBy: orders.approvedBy,
            reason: orders.reason,
        })
        .from(orders)
        .innerJoin(wards, eq(orders.wardId, wards.id))
        .where(inArray(orders.status, ["承認済み", "却下"]))
        .orderBy(desc(orders.orderDate))
        .limit(100); // 一旦100件制限
}

export async function getOrderItems(orderId: number) {
    return await db
        .select({
            id: orderItems.id,
            drugId: orderItems.drugId,
            drugName: drugs.name,
            drugUnit: drugs.unit,
            quantity: orderItems.quantity,
            approvedQuantity: orderItems.approvedQuantity,
            status: orderItems.status,
        })
        .from(orderItems)
        .innerJoin(drugs, eq(orderItems.drugId, drugs.id))
        .where(eq(orderItems.orderId, orderId));
}
