"use client";

import { useTransition } from "react";
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
    onUpdate: () => void;
};

export default function ApprovalOrderDetail({ order, onUpdate }: ApprovalOrderDetailProps) {
    const [isPending, startTransition] = useTransition();

    const handleApprove = async (itemId: number, currentQty: number) => {
        startTransition(async () => {
            const result = await approveItem(itemId, currentQty);
            if (result.success) onUpdate();
        });
    };

    const handleReject = async (itemId: number) => {
        if (!confirm("本当にこの薬品を却下しますか？")) return;
        startTransition(async () => {
            const result = await rejectItem(itemId);
            if (result.success) onUpdate();
        });
    };

    const handleCancel = async (itemId: number) => {
        if (!confirm("この承認を取り消して、承認待ちに戻しますか？")) return;
        startTransition(async () => {
            const result = await cancelItemApproval(itemId);
            if (result.success) onUpdate();
        });
    };

    const pendingCount = order.items.filter(i => i.status === "承認待ち").length;

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">

            {/* Header Area */}
            <div className="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-start shrink-0">
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm ${order.type === "緊急" ? "bg-red-50 text-red-600 border border-red-100" :
                            order.type === "定時" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                "bg-indigo-50 text-indigo-600 border border-indigo-100"
                        }`}>
                        {order.wardName.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{order.wardName}</h2>
                            <span className={`px-2.5 py-0.5 text-xs rounded-full font-bold border ${order.type === '緊急' ? 'bg-red-100 text-red-700 border-red-200' : order.type === '定時' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                                {order.type}請求
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(order.orderDate).toLocaleDateString('ja-JP')}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(order.orderDate).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>

                {order.reason && (
                    <div className="bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl max-w-sm">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 mb-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            申請者コメント
                        </div>
                        <p className="text-sm text-amber-900 leading-relaxed font-medium">
                            {order.reason}
                        </p>
                    </div>
                )}
            </div>

            {/* Main Content (Table) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">薬品名 / 規格</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-32">請求数</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-40">承認数</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-48">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {order.items.map((item) => {
                            const isPendingItem = item.status === "承認待ち";
                            const isPartial = item.status === "部分承認";
                            const isApproved = item.status === "承認済み";
                            const isRejected = item.status === "却下";

                            return (
                                <tr key={item.id} className={`group transition-all duration-200 ${isPendingItem || isPartial ? 'hover:bg-indigo-50/30' : 'bg-slate-50/40 text-slate-500'}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className={`text-base font-bold ${isPendingItem ? "text-slate-800" : "text-slate-600"}`}>{item.drugName}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                {isApproved && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">承認済</span>}
                                                {isPartial && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">部分承認</span>}
                                                {isRejected && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">却下</span>}
                                                <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1.5 rounded">{item.drugUnit}</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-bold text-slate-700">{item.quantity}</span>
                                            <span className="text-[10px] text-slate-400">請求</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {(isPendingItem || isPartial) ? (
                                            <div className="flex justify-end">
                                                <div className="relative w-24">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={item.quantity - (item.approvedQuantity || 0)}
                                                        defaultValue={item.quantity - (item.approvedQuantity || 0)}
                                                        className={`w-full text-right font-bold text-lg border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow ${isPartial ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-300 text-slate-800'}`}
                                                        id={`qty-input-${item.id}`}
                                                    />
                                                    {isPartial && (
                                                        <div className="text-[10px] text-amber-600 text-right mt-1 font-bold">済: {item.approvedQuantity}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-right">
                                                <span className={`text-lg font-bold ${isApproved ? "text-green-600" : "text-slate-400 line-through"}`}>
                                                    {item.approvedQuantity}
                                                </span>
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {(isPendingItem || isPartial) ? (
                                            <div className="flex justify-end items-center gap-2">
                                                <button
                                                    onClick={() => handleReject(item.id)}
                                                    disabled={isPending}
                                                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-300 transition-all focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                                                    title="却下"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const input = document.getElementById(`qty-input-${item.id}`) as HTMLInputElement;
                                                        handleApprove(item.id, parseInt(input.value));
                                                    }}
                                                    disabled={isPending}
                                                    className="flex items-center gap-1.5 bg-indigo-600 text-white pl-3 pr-4 py-2 rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:scale-100"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span className="font-bold text-sm">承認</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleCancel(item.id)}
                                                disabled={isPending}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-600 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                取消
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {order.items.length === 0 && (
                    <div className="p-16 text-center text-slate-400">
                        <span className="text-4xl block mb-2 opacity-30">📦</span>
                        アイテムがありません
                    </div>
                )}
            </div>

            {/* Action Bar (Sticky Bottom) if needed in future, currently empty but structure ready */}
            <div className="bg-slate-50 border-t border-slate-100 p-3 text-right">
                <span className="text-xs font-bold text-slate-400">
                    未処理: {pendingCount} 件
                </span>
            </div>
        </div>
    );
}
