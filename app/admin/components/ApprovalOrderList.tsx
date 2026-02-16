"use client";

type Order = {
    id: number;
    wardName: string;
    orderDate: string;
    type: string;
    status: string;
    items: any[];
};

type ApprovalOrderListProps = {
    orders: Order[];
    selectedOrderId: number | null;
    onSelectOrder: (orderId: number) => void;
};

export default function ApprovalOrderList({ orders, selectedOrderId, onSelectOrder }: ApprovalOrderListProps) {
    if (orders.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <span className="text-4xl mb-3 opacity-30">📭</span>
                <p className="text-sm font-bold text-slate-500 mb-1">該当オーダーなし</p>
                <p className="text-xs text-slate-400">条件を変更して再度検索してください</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-2 space-y-2">
            {orders.map((order) => {
                const isSelected = selectedOrderId === order.id;

                // Status Color Logic
                let statusColor = "bg-slate-100 text-slate-500";
                if (order.status === "承認待ち") statusColor = "bg-blue-100 text-blue-700 border-blue-200";
                else if (order.status === "部分承認") statusColor = "bg-amber-100 text-amber-700 border-amber-200";
                else if (order.status === "承認済み") statusColor = "bg-green-100 text-green-700 border-green-200";
                else if (order.status === "却下") statusColor = "bg-red-100 text-red-700 border-red-200";

                // Type Color Logic
                let typeColor = "bg-slate-100 text-slate-600";
                if (order.type === "緊急") typeColor = "bg-rose-100 text-rose-700 border-rose-200 font-bold animate-pulse-slow";
                else if (order.type === "定時") typeColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
                else if (order.type === "臨時") typeColor = "bg-indigo-100 text-indigo-700 border-indigo-200";

                return (
                    <button
                        key={order.id}
                        onClick={() => onSelectOrder(order.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 group relative ${isSelected
                                ? "bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-md z-10"
                                : "bg-white border-transparent hover:border-indigo-200 hover:shadow-sm hover:bg-slate-50/50"
                            }`}
                    >
                        {/* Selection Indicator Strip */}
                        {isSelected && (
                            <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-md"></div>
                        )}

                        <div className={`flex justify-between items-start mb-2 ${isSelected ? "pl-2" : ""}`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm ${isSelected ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"
                                    }`}>
                                    {order.wardName.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm leading-tight mb-0.5">
                                        {order.wardName}
                                    </div>
                                    <div className="flex gap-1">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusColor}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${typeColor}`}>
                                {order.type}
                            </span>
                        </div>

                        <div className={`flex justify-between items-end ${isSelected ? "pl-2" : ""}`}>
                            <span className="text-xs text-slate-400 font-mono">
                                {new Date(order.orderDate).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
                                <span className="ml-1 text-[10px] opacity-70">
                                    {new Date(order.orderDate).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </span>
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                {order.items.length} <span className="text-[10px] font-normal text-slate-400">品目</span>
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
