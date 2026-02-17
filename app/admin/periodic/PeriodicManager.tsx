"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/date-utils";
import PeriodicDetailClient from "./components/PeriodicDetailClient";
import ApprovalOrderDetail from "../components/ApprovalOrderDetail"; // Import Approval Component
import Link from "next/link";
import { getPeriodicOrdersByEventId, bulkApproveCycle } from "@/app/actions/periodic"; // Import actions direct
import { generateUpcomingEvents } from "@/app/actions/periodic-events"; // Import generation action

// Cycle Type Definition (based on getPeriodicCyclesFromEvents return)
type Cycle = {
    id: number; // Changed from string (date) to number (event id)
    date: string; // Payout Date
    deadline: string;
    isUpcoming: boolean;
    orderCount: number;
    pendingCount: number;
    partialCount: number;
    approvedCount: number;
    status: string;
};

type PeriodicOrder = {
    id: number;
    ward: { name: string };
    status: string;
    orderDate: string;
    type: string;
    reason: string | null;
    items: any[];
};

export default function PeriodicManager({
    cycles,
    // selectedOrders, // Deprecated prop
    // selectedDate, // Deprecated prop
    // filterStart,
    // filterEnd
}: {
    cycles: Cycle[];
    selectedOrders?: any[]; // Keep for compat if needed but we fetch internally
    selectedDate?: string | null;
    filterStart?: string;
    filterEnd?: string;
}) {
    const router = useRouter();
    // const searchParams = useSearchParams(); // We might not need URL state for simple ID selection if we fetch locally

    // Order Selection State
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

    const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
    const [orders, setOrders] = useState<PeriodicOrder[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Filter State
    const [selectedWard, setSelectedWard] = useState<string>("all");

    // Initial Selection (Auto Select first if available)
    useEffect(() => {
        if (!selectedCycleId && cycles.length > 0) {
            // Logic to find best default? Upcoming?
            const upcoming = cycles.find(c => c.status === "受付中");
            const defaultId = upcoming ? upcoming.id : cycles[0].id;
            handleSelectCycle(defaultId);
        }
    }, [cycles, selectedCycleId]);

    const handleSelectCycle = async (id: number) => {
        setSelectedCycleId(id);
        setSelectedOrderId(null); // Reset order selection when cycle changes
        setIsLoadingOrders(true);
        try {
            const data = await getPeriodicOrdersByEventId(id);
            setOrders(data as any);
        } catch (e) {
            console.error(e);
            alert("データの取得に失敗しました");
        } finally {
            setIsLoadingOrders(false);
        }
    };

    const handleBulkApprove = async () => {
        if (!selectedCycleId) return;
        if (!confirm("このクールの未承認オーダーを全て承認しますか？")) return;

        try {
            const res = await bulkApproveCycle(selectedCycleId);
            if (res.success) {
                alert(res.message);
                // Refresh data
                handleSelectCycle(selectedCycleId);
                router.refresh(); // Refresh parent to update counts if needed
            } else {
                alert(res.message);
            }
        } catch (e) {
            console.error(e);
            alert("エラーが発生しました");
        }
    };

    const handleGenerate = async () => {
        if (!confirm("今後3ヶ月分の定期請求イベント（クール）を自動生成しますか？")) return;
        setIsGenerating(true);
        try {
            const res = await generateUpcomingEvents(3);
            if (res.success) {
                alert(res.message);
                router.refresh();
            } else {
                alert(res.message);
            }
        } catch (e) {
            console.error(e);
            alert("生成エラーが発生しました");
        } finally {
            setIsGenerating(false);
        }
    };

    // Calculate details for selected view and filtering
    const uniqueWards = Array.from(new Set(orders.map(o => o.ward.name))).sort();

    const filteredOrders = selectedWard === "all"
        ? orders
        : orders.filter(o => o.ward.name === selectedWard);

    const pendingCount = filteredOrders.filter(o => o.status === "承認待ち").length || 0;
    const currentOrder = orders.find(o => o.id === selectedOrderId);
    const selectedCycle = cycles.find(c => c.id === selectedCycleId);

    // Mobile Step Logic
    // Step 1: Cycle List (No cycle selected)
    // Step 2: Order List (Cycle selected, no order selected)
    // Step 3: Detail (Order selected)
    let mobileStep = 1;
    if (selectedCycleId) mobileStep = 2;
    if (selectedOrderId) mobileStep = 3;

    return (
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-140px)] min-h-[600px] overflow-hidden">

            {/* COLUMN 1: Cycle List (Fixed Width) */}
            {/* Show on Mobile Step 1. Always show on desktop. */}
            <div className={`w-full md:w-[280px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-col flex-shrink-0 ${mobileStep === 1 ? 'flex' : 'hidden md:flex'}`}>
                <div className="p-3 border-b border-slate-100 bg-slate-50/50 font-bold text-sm text-slate-700">
                    請求クール一覧
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                    {cycles.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center gap-3">
                            <span>表示できるクールはありません</span>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-bold"
                            >
                                {isGenerating ? "生成中..." : "初期データを生成する"}
                            </button>
                        </div>
                    ) : (
                        cycles.map(cycle => {
                            const isSelected = cycle.id === selectedCycleId;
                            const dateObj = new Date(cycle.date);

                            return (
                                <button
                                    key={cycle.id}
                                    onClick={() => handleSelectCycle(cycle.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all relative group ${isSelected
                                        ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 z-10"
                                        : "bg-white border-slate-100 hover:border-slate-300"
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cycle.status === "受付中" ? "bg-green-100 text-green-700" :
                                            cycle.status === "締切後" ? "bg-amber-100 text-amber-700" :
                                                "bg-slate-100 text-slate-500"
                                            }`}>
                                            {cycle.status}
                                        </span>
                                        <div className="flex gap-1">
                                            {cycle.pendingCount > 0 && (
                                                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full" title="承認待ち">
                                                    {cycle.pendingCount}
                                                </span>
                                            )}
                                            {cycle.partialCount > 0 && (
                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full" title="部分承認">
                                                    {cycle.partialCount}
                                                </span>
                                            )}
                                            {cycle.approvedCount > 0 && (
                                                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full" title="承認済み">
                                                    {cycle.approvedCount}
                                                </span>
                                            )}
                                            {cycle.orderCount === 0 && (
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                                    0
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="font-bold text-slate-800 text-sm">
                                        {formatDate(dateObj)}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1">
                                        締切: {formatDate(new Date(cycle.deadline))}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* COLUMN 2: Order List (Middle) */}
            {/* Show on Mobile Step 2. Always show on desktop. */}
            <div className={`w-full md:w-[320px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-col flex-shrink-0 ${mobileStep === 2 ? 'flex' : 'hidden md:flex'}`}>
                {/* Mobile Back Button (To Cycle List) */}
                <div className="md:hidden pt-2 px-2">
                    <button
                        onClick={() => setSelectedCycleId(null)}
                        className="w-full flex items-center justify-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-bold bg-slate-50 px-2 py-2 rounded border border-slate-200"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        クール選択に戻る
                    </button>
                </div>

                {selectedCycle ? (
                    <>
                        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-sm text-slate-700 mb-1">
                                📅 {formatDate(new Date(selectedCycle.date))}
                            </h3>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">{filteredOrders.length} 件の請求</span>
                                {pendingCount > 0 && (
                                    <div className="flex items-center">
                                        <span className="text-xs font-bold text-red-500 mr-2">{pendingCount}件 未承認</span>
                                        <button
                                            onClick={handleBulkApprove}
                                            className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded"
                                        >
                                            一括承認
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* NEW: Ward Filter */}
                            <div className="mt-2">
                                <select
                                    className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={selectedWard}
                                    onChange={(e) => setSelectedWard(e.target.value)}
                                >
                                    <option value="all">全ての部署 ({orders.length})</option>
                                    {uniqueWards.map(ward => (
                                        <option key={ward} value={ward}>{ward}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {isLoadingOrders ? (
                                <div className="p-10 text-center text-slate-400 text-xs">読み込み中...</div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <div className="mb-2 text-2xl">😴</div>
                                    <p className="text-xs">請求なし</p>
                                </div>
                            ) : (
                                filteredOrders.map(order => (
                                    <button
                                        key={order.id}
                                        onClick={() => setSelectedOrderId(order.id)}
                                        className={`w-full text-left p-3 rounded-lg border transition-all group ${selectedOrderId === order.id
                                            ? "bg-indigo-50 text-indigo-900 border-indigo-500 ring-1 ring-indigo-500 shadow-md scroll-mt-20"
                                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-bold ${selectedOrderId === order.id ? "text-indigo-900" : "text-slate-800"}`}>
                                                {order.ward.name}
                                            </span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${order.status === "承認待ち" ? "bg-red-100 text-red-700" :
                                                order.status === "部分承認" ? "bg-amber-100 text-amber-700" :
                                                    order.status === "承認済み" ? "bg-green-100 text-green-700" :
                                                        "bg-slate-100 text-slate-500"
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className={`text-xs flex items-center justify-between ${selectedOrderId === order.id ? "text-indigo-700" : "text-slate-500"}`}>
                                            <span>IDs: {order.items.length}</span>
                                            <span suppressHydrationWarning>
                                                {new Date(order.orderDate).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                        左からクールを選択
                    </div>
                )}
            </div>

            {/* COLUMN 3: Details (Right) */}
            {/* Show on Mobile Step 3. Always show on desktop. */}
            <div className={`flex-1 min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-col md:ml-0 ml-0 relative ${mobileStep === 3 ? 'flex' : 'hidden md:flex'}`}>

                {/* Mobile Back Button (To Order List) */}
                <div className="md:hidden border-b border-slate-100 p-2">
                    <button
                        onClick={() => setSelectedOrderId(null)}
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm font-bold w-full p-1"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        オーダー選択に戻る
                    </button>
                </div>

                {currentOrder ? (
                    <ApprovalOrderDetail
                        order={currentOrder}
                        onUpdate={() => handleSelectCycle(selectedCycleId!)}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <p className="font-bold text-slate-500">オーダーを選択してください</p>
                        <p className="text-xs text-slate-400 mt-1">詳細が表示され、承認操作を行えます</p>
                    </div>
                )}
            </div>
        </div >
    );
}
