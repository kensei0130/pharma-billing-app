import { useState } from "react";

export default function ApprovalOrderList({
    orders,
    selectedOrderId,
    onSelectOrder
}: {
    orders: any[];
    selectedOrderId: number | null;
    onSelectOrder: (id: number) => void;
}) {
    if (orders.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-sm font-bold">オーダーがありません</p>
                <p className="text-xs mt-1 opacity-70">条件に一致する承認待ちオーダーはありません</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar">
            {orders.map((order) => {
                const isSelected = selectedOrderId === order.id;

                // Status Color Logic
                let statusColor = "bg-slate-100 text-slate-500";
                if (order.status === "承認待ち") statusColor = "bg-red-100 text-red-700 border-red-200";
                else if (order.status === "部分承認") statusColor = "bg-amber-100 text-amber-700 border-amber-200";
                else if (order.status === "承認済み") statusColor = "bg-green-100 text-green-700 border-green-200";
                else if (order.status === "却下") statusColor = "bg-slate-100 text-slate-700 border-slate-200";

                // Type Color Logic (Only for Badge now)
                let typeColor = "bg-slate-100 text-slate-600";

                if (order.type === "緊急") {
                    typeColor = "bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse-slow";
                }
                else if (order.type === "定時") {
                    typeColor = "bg-blue-50 text-blue-700 border-blue-200";
                }
                else if (order.type === "臨時") {
                    typeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                }

                return (
                    <button
                        key={order.id}
                        onClick={() => onSelectOrder(order.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all group ${isSelected
                            ? "bg-indigo-50 text-indigo-900 border-indigo-500 ring-1 ring-indigo-500 shadow-md scroll-mt-20"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                            }`}
                    >
                        <div className={`flex justify-between items-start mb-1`}>
                            <div className="flex items-center gap-2">
                                <div>
                                    <div className={`font-bold text-sm leading-tight mb-0.5 ${isSelected ? "text-indigo-900" : "text-slate-800"}`}>
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

                        <div className={`flex justify-between items-end`}>
                            <span className={`text-xs font-mono ${isSelected ? "text-indigo-700" : "text-slate-500"}`}>
                                {new Date(order.orderDate).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
                                <span className="ml-1 text-[10px] opacity-70">
                                    {new Date(order.orderDate).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isSelected ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                                {order.items.length} <span className={`text-[10px] font-normal ${isSelected ? "text-indigo-500" : "text-slate-400"}`}>品目</span>
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
