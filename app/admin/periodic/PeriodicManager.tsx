"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/date-utils";
import PeriodicDetailClient from "./components/PeriodicDetailClient";
import ApprovalOrderDetail from "../components/ApprovalOrderDetail"; // Import Approval Component
import Link from "next/link";

type Cycle = {
    date: string;
    isUpcoming: boolean;
    orderCount: number;
    status: string;
};

type Order = {
    id: number;
    ward: { name: string };
    status: string | null;
    orderDate: string;
    items: { length: number };
};

export default function PeriodicManager({
    cycles,
    selectedOrders,
    selectedDate,
    filterStart,
    filterEnd
}: {
    cycles: Cycle[];
    selectedOrders: any[] | null;
    selectedDate: string | null;
    filterStart: string;
    filterEnd: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Filter State (Local)
    const [startDate, setStartDate] = useState(filterStart);
    const [endDate, setEndDate] = useState(filterEnd);

    // Order Selection State
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

    // Apply Filter on Change
    const handleFilterApply = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (startDate) params.set("startDate", startDate);
        else params.delete("startDate");

        if (endDate) params.set("endDate", endDate);
        else params.delete("endDate");

        router.push(`/admin/periodic?${params.toString()}`);
    };

    const handleSelectCycle = (date: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("date", encodeURIComponent(date));
        setSelectedOrderId(null); // Reset order selection
        router.push(`/admin/periodic?${params.toString()}`);
    };

    const handleDataUpdate = () => {
        router.refresh();
    };

    // Calculate details for selected view
    const pendingCount = selectedOrders?.filter(o => o.status === "承認待ち").length || 0;
    const currentOrder = selectedOrders?.find(o => o.id === selectedOrderId);

    return (
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-140px)] min-h-[600px] overflow-hidden">

            {/* COLUMN 1: Cycle List (Fixed Width) */}
            <div className="w-full md:w-[280px] flex flex-col gap-3 flex-shrink-0">
                {/* Filter Box */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                        期間フィルタ
                    </h3>
                    <div className="grid grid-cols-2 gap-1">
                        <div>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                onBlur={handleFilterApply}
                                className="w-full text-[10px] font-bold p-1 bg-slate-50 border border-slate-200 rounded"
                            />
                        </div>
                        <div>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                onBlur={handleFilterApply}
                                className="w-full text-[10px] font-bold p-1 bg-slate-50 border border-slate-200 rounded"
                            />
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-500 uppercase tracking-wider">
                        請求クール
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                        {cycles.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-xs">
                                表示期間内にクールはありません
                            </div>
                        ) : (
                            cycles.map(cycle => {
                                const isSelected = cycle.date === selectedDate;
                                const dateObj = new Date(cycle.date);

                                return (
                                    <button
                                        key={cycle.date}
                                        onClick={() => handleSelectCycle(cycle.date)}
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
                                            {cycle.orderCount > 0 && (
                                                <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded-full">
                                                    {cycle.orderCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="font-bold text-slate-800 text-sm">
                                            {formatDate(dateObj)}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* COLUMN 2: Order List (Middle) */}
            <div className="w-full md:w-[320px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-shrink-0">
                {selectedDate && selectedOrders ? (
                    <>
                        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-sm text-slate-700 mb-1">
                                📅 {formatDate(new Date(selectedDate))}
                            </h3>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">{selectedOrders.length} 件の請求</span>
                                {pendingCount > 0 && (
                                    <PeriodicDetailClient dateStr={selectedDate} hasPending={true} />
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {selectedOrders.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <div className="mb-2 text-2xl">😴</div>
                                    <p className="text-xs">請求なし</p>
                                </div>
                            ) : (
                                selectedOrders.map(order => (
                                    <button
                                        key={order.id}
                                        onClick={() => setSelectedOrderId(order.id)}
                                        className={`w-full text-left p-3 rounded-lg border transition-all group ${selectedOrderId === order.id
                                                ? "bg-slate-800 text-white border-slate-800 shadow-md"
                                                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-bold ${selectedOrderId === order.id ? "text-white" : "text-slate-800"}`}>
                                                {order.ward.name}
                                            </span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${order.status === "承認待ち" ? "bg-blue-100 text-blue-700" :
                                                    order.status === "承認済み" ? "bg-green-100 text-green-700" :
                                                        "bg-red-100 text-red-700"
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className={`text-xs flex items-center justify-between ${selectedOrderId === order.id ? "text-slate-300" : "text-slate-500"}`}>
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
            <div className="flex-1 min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:ml-0 ml-0 relative">
                {currentOrder ? (
                    <ApprovalOrderDetail
                        order={currentOrder}
                        onUpdate={handleDataUpdate}
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
        </div>
    );
}
