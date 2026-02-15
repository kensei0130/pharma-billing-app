import { auth } from "@/auth";
import { getAdminOrders, getOrderItems, getOrderStatusCounts } from "@/db/queries";
import AdminApprovalConsole from "./components/AdminApprovalConsole";

export default async function AdminDashboard(props: {
    searchParams: Promise<{ status?: string; type?: string; startDate?: string; endDate?: string }>
}) {
    const searchParams = await props.searchParams;
    const session = await auth();

    // Defaults:
    // Status: Pending ("pending")
    // Type: Temporary ("臨時")
    // Date: All (undefined) - User wants to see ALL pending by default

    // Check if params are present at all. If not, apply defaults.
    // However, if one is present, we respect it.
    // Actually, "Default is Pending, Temporary" implies initial load state.

    const statusParam = searchParams.status ?? "pending";
    const typeParam = searchParams.type ?? "臨時";
    const startDate = searchParams.startDate; // Undefined by default
    const endDate = searchParams.endDate;

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

    const counts = await getOrderStatusCounts();

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



    // Count only pending (could separate query but let's just use filtered result if in pending mode, or hide if not)
    // Actually, dashboard header usually wants "Total Pending". 
    // Optimization: separate count query? For now, let's just show "Displaying X orders"

    return (
        <div className="max-w-[1600px] mx-auto px-4 py-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">承認コンソール</h2>
                    <p className="text-slate-500 text-sm mt-1">病棟からの請求を効率的に処理できます。</p>
                </div>
                {/* 
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center">
                    <span className="text-slate-500 text-sm mr-2">表示中:</span>
                    <span className="text-xl font-bold text-slate-800">{orders.length}</span>
                    <span className="text-xs text-slate-400 ml-1">件</span>
                </div>
                 */}
            </div>

            <AdminApprovalConsole orders={ordersWithItems} counts={counts} />
        </div>
    );
}
