"use client";

import { useState } from "react";
import { approveItem, rejectItem } from "@/app/actions/admin";

type OrderItem = {
    id: number;
    drugId: number;
    drugName: string;
    drugUnit: string;
    quantity: number;
    approvedQuantity: number;
    status: string;
};

type OrderApprovalCardProps = {
    orderId: number;
    wardName: string;
    orderDate: string;
    items: OrderItem[];
};

export default function OrderApprovalCard({ orderId, wardName, orderDate, items: initialItems }: OrderApprovalCardProps) {
    const [items, setItems] = useState<OrderItem[]>(initialItems);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleApprove = async (itemId: number, currentQty: number) => {
        const result = await approveItem(itemId, currentQty);
        if (result.success) {
            setItems(items.map(i => i.id === itemId ? { ...i, status: "承認済み", approvedQuantity: currentQty } : i));
        }
    };

    const handleReject = async (itemId: number) => {
        if (!confirm("この薬品を却下しますか？")) return;
        const result = await rejectItem(itemId);
        if (result.success) {
            setItems(items.map(i => i.id === itemId ? { ...i, status: "却下", approvedQuantity: 0 } : i));
        }
    };

    const handleQuantityChange = async (itemId: number, newQty: number) => {
        // Just UI update for now, actual update happens on "Approve"
        // In a real app, might want specific "Update" button or optimizing
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div
                className="p-6 cursor-pointer flex items-center justify-between"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center">
                    <div className="bg-indigo-50 p-3 rounded-full mr-4 text-indigo-600 font-bold text-lg">
                        {wardName.substring(0, 1)}
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-800">{wardName}</h4>
                        <div className="text-sm text-slate-500">
                            {new Date(orderDate).toLocaleString("ja-JP")}
                            <span className="mx-2">•</span>
                            {items.length} 品目
                        </div>
                    </div>
                </div>
                <div className="flex items-center text-slate-400">
                    <span className="text-sm mr-2">{isExpanded ? "閉じる" : "詳細を表示"}</span>
                    <svg className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-6">
                    <table className="min-w-full">
                        <thead>
                            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="pb-3">薬品名</th>
                                <th className="pb-3 text-right">請求数</th>
                                <th className="pb-3 text-right">承認数</th>
                                <th className="pb-3 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item) => (
                                <tr key={item.id} className="group">
                                    <td className="py-3 text-sm font-medium text-slate-900">
                                        {item.drugName}
                                        {item.status === "承認済み" && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">承</span>}
                                        {item.status === "却下" && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">却</span>}
                                    </td>
                                    <td className="py-3 text-sm text-slate-600 text-right">
                                        {item.quantity} <span className="text-xs text-slate-400">{item.drugUnit}</span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <div className="flex justify-end">
                                            <input
                                                type="number"
                                                min="0"
                                                max={item.quantity}
                                                defaultValue={item.status === "承認済み" ? item.approvedQuantity : item.quantity}
                                                className="w-20 px-2 py-1 text-right text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                                disabled={item.status !== "承認待ち"}
                                                id={`qty-${item.id}`}
                                            />
                                        </div>
                                    </td>
                                    <td className="py-3 text-right">
                                        {item.status === "承認待ち" && (
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => {
                                                        const el = document.getElementById(`qty-${item.id}`) as HTMLInputElement;
                                                        handleApprove(item.id, parseInt(el.value));
                                                    }}
                                                    className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition-colors"
                                                >
                                                    承認
                                                </button>
                                                <button
                                                    onClick={() => handleReject(item.id)}
                                                    className="px-3 py-1 bg-white border border-slate-300 text-slate-600 text-xs font-bold rounded hover:bg-slate-50 transition-colors"
                                                >
                                                    却下
                                                </button>
                                            </div>
                                        )}
                                        {item.status !== "承認待ち" && (
                                            <span className="text-xs text-slate-400 font-mono">完了</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
