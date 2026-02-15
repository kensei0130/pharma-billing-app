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

    // Filter States (Sync with URL)
    // Server defaults are now: Status=pending, Type=臨時, Date=undefined
    // We should match client defaults to URL params OR the hardcoded defaults if params missing.

    // NOTE: searchParams.get returns null if missing.
    const currentStatus = searchParams.get("status") ?? "pending";
    const currentType = searchParams.get("type") ?? "臨時";
    const startDate = searchParams.get("startDate") ?? "";
    const endDate = searchParams.get("endDate") ?? "";

    // Sync unnecessary? page.tsx handles data fetching based on these defaults if missing.
    // But we might want to push defaults to URL so user sees them?
    // Let's rely on the Select value matching the server assumption.

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "none") { // "none" or empty checking
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    // Auto-select first order
    useEffect(() => {
        if (orders.length > 0) {
            const stillExists = orders.find(o => o.id === selectedOrderId);
            if (!stillExists) {
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
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-180px)] min-h-[600px]">
            {/* Left Panel: Filters & List */}
            <div className="w-full md:w-80 flex-shrink-0 flex flex-col space-y-4">

                {/* Unified Filter Panel */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">期間 (Date Range)</label>
                        <div className="flex items-center gap-1">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                                className="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-indigo-500"
                            />
                            <span className="text-slate-300">~</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                                className="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 block mb-1">状態</label>
                            <select
                                value={currentStatus}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                                className="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-indigo-500 bg-white"
                            >
                                <option value="all">全て表示 ({Object.values(counts).reduce((a, b) => a + b, 0)})</option>
                                <option value="pending">承認待ちのみ ({counts["承認待ち"] || 0})</option>
                                <option value="partial">部分承認のみ ({counts["部分承認"] || 0})</option>
                                <option value="approved">完了のみ ({(counts["承認済み"] || 0) + (counts["却下"] || 0)})</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 block mb-1">種別</label>
                            <select
                                value={currentType}
                                onChange={(e) => handleFilterChange("type", e.target.value)}
                                className="w-full text-xs border border-slate-200 rounded p-1.5 outline-none focus:border-indigo-500 bg-white"
                            >
                                <option value="all">全て</option>
                                <option value="臨時">臨時</option>
                                <option value="定時">定時</option>
                                <option value="緊急">緊急</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-1 flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            該当オーダー ({orders.length})
                        </h3>
                    </div>
                    <ApprovalOrderList
                        orders={orders}
                        selectedOrderId={selectedOrderId}
                        onSelectOrder={setSelectedOrderId}
                    />
                </div>
            </div>

            {/* Right Panel: Detail View */}
            <div className="flex-1 min-w-0">
                {selectedOrder ? (
                    <ApprovalOrderDetail
                        order={selectedOrder}
                        onUpdate={handleDataUpdate}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                        <p className="font-medium">オーダーを選択してください</p>
                    </div>
                )}
            </div>
        </div>
    );
}
