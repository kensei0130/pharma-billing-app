"use client";

import { useState, useTransition } from "react";
import { approveItem, rejectItem, cancelItemApproval } from "@/app/actions/admin";

type OrderItem = {
    id: number;
    drugId: number;
    drugName: string;
    drugUnit: string;
    quantity: number;
    approvedQuantity: number;
    status: string;
};

type Order = {
    id: number;
    wardName: string;
    orderDate: string;
    type: string;
    status: string;
    reason: string | null;
    items: OrderItem[];
};

type ApprovalOrderDetailProps = {
    order: Order;
    onUpdate: () => void; // Callback to refresh data
};

export default function ApprovalOrderDetail({ order, onUpdate }: ApprovalOrderDetailProps) {
    const [isPending, startTransition] = useTransition();

    const handleApprove = async (itemId: number, currentQty: number) => {
        startTransition(async () => {
            const result = await approveItem(itemId, currentQty);
            if (result.success) {
                onUpdate(); // Trigger refresh
            }
        });
    };

    const handleReject = async (itemId: number) => {
        if (!confirm("本当にこの薬品を却下しますか？")) return;
        startTransition(async () => {
            const result = await rejectItem(itemId);
            if (result.success) {
                onUpdate();
            }
        });
    };

    const handleCancel = async (itemId: number) => {
        if (!confirm("この承認を取り消して、承認待ちに戻しますか？")) return;
        startTransition(async () => {
            const result = await cancelItemApproval(itemId);
            if (result.success) {
                onUpdate();
            }
        });
    };

    const pendingItemsCount = order.items.filter(i => i.status === "承認待ち").length;

    return (
        <div className="h-full flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-bold text-slate-800">{order.wardName}</h2>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-bold border ${order.type === '緊急' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                            {order.type}請求
                        </span>
                    </div>
                    <div className="text-sm text-slate-500">
                        {new Date(order.orderDate).toLocaleString('ja-JP')}
                        <span className="mx-2 text-slate-300">|</span>
                        全 {order.items.length} 品目
                    </div>
                </div>

                {order.reason && (
                    <div className="bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg max-w-xs">
                        <div className="text-xs font-bold text-yellow-700 mb-0.5">備考・理由</div>
                        <div className="text-sm text-yellow-800">{order.reason}</div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-0">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">薬品名</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">請求数</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">承認数</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {order.items.map((item) => (
                            <tr key={item.id} className={`group transition-colors ${item.status === '承認待ち' ? 'hover:bg-slate-50' : 'bg-slate-50/30'}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div>
                                            <div className="text-sm font-bold text-slate-800">{item.drugName}</div>
                                            <div className="flex mt-1">
                                                {item.status === "承認済み" && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">承認済</span>}
                                                {item.status === "部分承認" && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">部分</span>}
                                                {item.status === "却下" && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">却下</span>}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="text-sm text-slate-600 font-medium">
                                        {item.quantity} <span className="text-xs text-slate-400 font-normal">{item.drugUnit}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    {(item.status === "承認待ち" || item.status === "部分承認") ? (
                                        <div className="flex flex-col items-end gap-1">
                                            {item.status === "部分承認" && (
                                                <div className="text-xs text-green-600 font-bold mb-1">
                                                    承認済: {item.approvedQuantity}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-end">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={item.quantity - (item.approvedQuantity || 0)}
                                                    defaultValue={item.quantity - (item.approvedQuantity || 0)}
                                                    className={`w-20 text-right border-slate-300 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold ${item.status === '部分承認' ? 'bg-yellow-50 border-yellow-300' : 'bg-white border'}`}
                                                    id={`qty-input-${item.id}`}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <span className={`text-sm font-bold ${item.status === '承認済み' ? 'text-green-600' : 'text-slate-400 line-through'}`}>
                                            {item.approvedQuantity}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    {(item.status === "承認待ち" || item.status === "部分承認") && (
                                        <div className="flex justify-end gap-2 opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    const input = document.getElementById(`qty-input-${item.id}`) as HTMLInputElement;
                                                    handleApprove(item.id, parseInt(input.value));
                                                }}
                                                disabled={isPending}
                                                className="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50 text-xs font-bold flex items-center gap-1"
                                            >
                                                {item.status === "部分承認" ? "残り承認" : "承認"}
                                            </button>
                                            <button
                                                onClick={() => handleReject(item.id)}
                                                disabled={isPending}
                                                className="bg-white text-slate-500 border border-slate-300 px-3 py-1.5 rounded-md hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all disabled:opacity-50 text-xs font-bold"
                                            >
                                                却下
                                            </button>
                                        </div>
                                    )}
                                    {(item.status === "承認済み" || item.status === "却下") && (
                                        <button
                                            onClick={() => handleCancel(item.id)}
                                            disabled={isPending}
                                            className="text-xs text-slate-400 underline hover:text-red-500 disabled:opacity-50"
                                        >
                                            承認取り消し
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {order.items.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        アイテムがありません
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="text-xs text-slate-500">
                    残り承認待ち: <span className="font-bold text-slate-700">{pendingItemsCount}</span> 件
                </div>
                {/* Future: Batch approve button could go here */}
            </div>
        </div>
    );
}
