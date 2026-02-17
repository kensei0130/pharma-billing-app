import { auth } from "@/auth";
import { getAdminOrders, getOrderItems, getOrderStatusCounts } from "@/db/queries";
import AdminApprovalConsole from "../components/AdminApprovalConsole";

export default async function AdminBillingPage(props: {
    searchParams: Promise<{ status?: string; type?: string; startDate?: string; endDate?: string }>
}) {
    const searchParams = await props.searchParams;
    const session = await auth();

    // Defaults:
    // Status: Pending ("pending")
    // Type: Temporary ("臨時")

    // Date: Default to TODAY if not specified
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const statusParam = searchParams.status ?? "pending";
    const typeParam = searchParams.type ?? "臨時";
    const startDate = searchParams.startDate ?? todayStr;
    const endDate = searchParams.endDate ?? todayStr;

    // Construct filters
    let statusFilter: string[] | undefined = undefined;
    if (statusParam === "pending") {
        statusFilter = ["承認待ち"];
    } else if (statusParam === "partial") {
        statusFilter = ["部分承認"];
    } else if (statusParam === "approved") {
        statusFilter = ["承認済み", "却下"];
    } else if (statusParam === "all") {
        statusFilter = undefined;
    }

    const typeFilter = typeParam && typeParam !== "all" ? [typeParam] : undefined;

    const orders = await getAdminOrders({
        status: statusFilter,
        type: typeFilter,
        startDate: startDate,
        endDate: endDate
    });

    const counts = await getOrderStatusCounts({
        startDate,
        endDate,
        type: typeFilter
    });

    // Fetch items (can be optimized but keeping loop for now as items structure is expected)
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
        const items = await getOrderItems(order.id);
        return {
            ...order,
            items: items.map(item => ({
                ...item,
                approvedQuantity: item.approvedQuantity ?? 0
            }))
        };
    }));

    return (
        <div className="max-w-[1600px] mx-auto px-4 py-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">薬品請求管理</h2>
                </div>
            </div>

            <AdminApprovalConsole
                orders={ordersWithItems}
                counts={counts}
                defaultStartDate={startDate}
                defaultEndDate={endDate}
            />
        </div>
    );
}
