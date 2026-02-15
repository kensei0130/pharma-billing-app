"use client";

type Order = {
    id: number;
    wardName: string;
    orderDate: string;
    type: string;
    status: string;
    items: any[]; // simplified for list display
};

type ApprovalOrderListProps = {
    orders: Order[];
    selectedOrderId: number | null;
    onSelectOrder: (orderId: number) => void;
};

export default function ApprovalOrderList({ orders, selectedOrderId, onSelectOrder }: ApprovalOrderListProps) {
    if (orders.length === 0) {
        return (
            <div className="p-4 text-center text-slate-500 text-sm bg-white rounded-lg border border-slate-200">
                承認待ちの請求はありません
            </div>
        );
    }

    return (
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
            {orders.map((order) => (
                <button
                    key={order.id}
                    onClick={() => onSelectOrder(order.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group relative overflow-hidden ${selectedOrderId === order.id
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 scale-[1.02]"
                        : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-sm"
                        }`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <div className="font-bold flex items-center">
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs mr-2 font-bold flex-shrink-0 ${selectedOrderId === order.id ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"}`}>
                                {order.wardName.charAt(0)}
                            </span>
                            <div className="flex flex-col">
                                <span className={`mr-2 ${selectedOrderId === order.id ? "text-white" : "text-slate-800"}`}>
                                    {order.wardName}
                                </span>
                                {order.status !== "承認待ち" && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block w-fit ${order.status === "承認済み" || order.status === "部分承認" ? "bg-green-100 text-green-700" :
                                            order.status === "却下" ? "bg-slate-100 text-slate-500" : "bg-gray-100 text-gray-500"
                                        }`}>
                                        {order.status}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border whitespace-nowrap ${order.type === "緊急"
                            ? (selectedOrderId === order.id ? "bg-red-500 text-white border-red-400" : "bg-red-100 text-red-700 border-red-200")
                            : order.type === "定時"
                                ? (selectedOrderId === order.id ? "bg-green-500 text-white border-green-400" : "bg-green-100 text-green-700 border-green-200")
                                : (selectedOrderId === order.id ? "bg-indigo-500 text-white border-indigo-400" : "bg-indigo-100 text-indigo-700 border-indigo-200")
                            }`}>
                            {order.type}
                        </span>
                    </div>

                    <div className="flex justify-between items-end">
                        <div className={`text-xs ${selectedOrderId === order.id ? "text-indigo-100" : "text-slate-400"}`}>
                            {new Date(order.orderDate).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className={`text-xs font-medium ${selectedOrderId === order.id ? "text-white" : "text-slate-500"}`}>
                            {order.items.length} 品目
                        </div>
                    </div>

                    {selectedOrderId === order.id && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-1">
                            <svg className="w-6 h-6 text-white opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
}
