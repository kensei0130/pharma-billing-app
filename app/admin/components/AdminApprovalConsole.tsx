"use client";

import { useState, useEffect } from "react";
import ApprovalOrderList from "./ApprovalOrderList";
import ApprovalOrderDetail from "./ApprovalOrderDetail";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function AdminApprovalConsole({
    orders,
    counts
}: {
    orders: any[];
    counts: { [key: string]: number };
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

    const currentStatus = searchParams.get("status") ?? "pending";
    const currentType = searchParams.get("type") ?? "臨時";
    const startDate = searchParams.get("startDate") ?? "";
    const endDate = searchParams.get("endDate") ?? "";

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "none") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    // Auto-select first order logic...
    useEffect(() => {
        if (orders.length > 0) {
            const stillExists = orders.find(o => o.id === selectedOrderId);
            if (!stillExists && !selectedOrderId) { // Only auto-select if nothing selected yet or selected is gone
                setSelectedOrderId(orders[0].id);
            } else if (!stillExists && selectedOrderId) {
                // specific logic: if selected item disappears (e.g. status change filter), maybe select first?
                setSelectedOrderId(orders[0].id);
            }
        } else {
            setSelectedOrderId(null);
        }
    }, [orders, selectedOrderId]);

    const selectedOrder = orders.find(o => o.id === selectedOrderId);

    const handleDataUpdate = () => {
        router.refresh();
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px]">
            {/* Left Panel: Filters & List */}
            <div className="w-full md:w-[360px] flex-shrink-0 flex flex-col gap-4">

                {/* Filter Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            フィルター
                        </h3>
                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
                            {orders.length} 件ヒット
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">期間</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                                    className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                                <span className="text-slate-300">~</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                                    className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">状態</label>
                            <select
                                value={currentStatus}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                                className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer hover:bg-slate-100 transition-all"
                            >
                                <option value="all">全て</option>
                                <option value="pending">承認待ち ({counts["承認待ち"] || 0})</option>
                                <option value="partial">部分承認 ({counts["部分承認"] || 0})</option>
                                <option value="approved">完了 ({(counts["承認済み"] || 0) + (counts["却下"] || 0)})</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">種別</label>
                            <select
                                value={currentType}
                                onChange={(e) => handleFilterChange("type", e.target.value)}
                                className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer hover:bg-slate-100 transition-all"
                            >
                                <option value="all">全て</option>
                                <option value="臨時">臨時</option>
                                <option value="定時">定時</option>
                                <option value="緊急">緊急</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* List Container */}
                <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">オーダー一覧</h4>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <ApprovalOrderList
                            orders={orders}
                            selectedOrderId={selectedOrderId}
                            onSelectOrder={setSelectedOrderId}
                        />
                    </div>
                </div>
            </div>

            {/* Right Panel: Detail View */}
            <div className="flex-1 min-w-0 flex flex-col">
                {selectedOrder ? (
                    <ApprovalOrderDetail
                        order={selectedOrder}
                        onUpdate={handleDataUpdate}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-600 mb-1">オーダーが選択されていません</h3>
                        <p className="text-sm">左側のリストからオーダーを選択して承認作業を行ってください。</p>
                    </div>
                )}
            </div>
        </div>
    );
}
