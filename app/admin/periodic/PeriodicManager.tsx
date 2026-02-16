"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/date-utils";
import PeriodicDetailClient from "./components/PeriodicDetailClient"; // Updated import
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
    selectedOrders: Order[] | null;
    selectedDate: string | null;
    filterStart: string;
    filterEnd: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Filter State (Local)
    const [startDate, setStartDate] = useState(filterStart);
    const [endDate, setEndDate] = useState(filterEnd);

    // Apply Filter on Change (Debounced or Blur - using Blur for simplicity or Button)
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
        params.set("date", encodeURIComponent(date)); // Keep filter params
        router.push(`/admin/periodic?${params.toString()}`);
    };

    // Calculate details for selected view
    const pendingCount = selectedOrders?.filter(o => o.status === "承認待ち").length || 0;
    const totalItems = selectedOrders?.reduce((sum, o) => sum + o.items.length, 0) || 0;
    const selectedCycle = cycles.find(c => c.date === selectedDate);

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px]">
            {/* LEFT COLUMN: Cycle List */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">

                {/* Filter Box */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                        期間フィルタ
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">開始</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                onBlur={handleFilterApply}
                                className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">終了</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                onBlur={handleFilterApply}
                                className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-500 uppercase tracking-wider">
                        請求クール一覧
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                        {cycles.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                表示期間内にクールはありません
                            </div>
                        ) : (
                            cycles.map(cycle => {
                                const isSelected = cycle.date === selectedDate;
                                const dateObj = new Date(cycle.date);
                                const isUpcoming = cycle.status === "受付中";

                                return (
                                    <button
                                        key={cycle.date}
                                        onClick={() => handleSelectCycle(cycle.date)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all relative group ${isSelected
                                            ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 z-10"
                                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cycle.status === "受付中" ? "bg-green-100 text-green-700" :
                                                cycle.status === "締切後" ? "bg-amber-100 text-amber-700" :
                                                    "bg-slate-100 text-slate-500"
                                                }`}>
                                                {cycle.status}
                                            </span>
                                            {cycle.orderCount > 0 && (
                                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                                    {cycle.orderCount}件
                                                </span>
                                            )}
                                        </div>
                                        <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                            {formatDate(dateObj)}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Details */}
            <div className="w-full md:w-2/3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                {selectedDate && selectedOrders ? (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/30">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    📅 {formatDate(new Date(selectedDate))}
                                    {pendingCount > 0 && (
                                        <span className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full animate-pulse border border-red-200">
                                            未承認 {pendingCount} 件
                                        </span>
                                    )}
                                </h2>
                                <div className="mt-2 flex gap-4 text-sm text-slate-500">
                                    <span>総請求: <strong className="text-slate-800">{selectedOrders.length}</strong> 病棟</span>
                                    <span>アイテム: <strong className="text-slate-800">{totalItems}</strong> 個</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <PeriodicDetailClient dateStr={selectedDate} hasPending={pendingCount > 0} />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {selectedOrders.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <div className="mb-4 text-4xl">😴</div>
                                    <p>このクールの請求はまだありません</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedOrders.map(order => (
                                        <div key={order.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all group flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xl flex items-center justify-center border border-indigo-100">
                                                    {order.ward.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-lg">{order.ward.name}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                                        <span>ID: {order.id}</span>
                                                        <span className="text-slate-300">|</span>
                                                        <span>{order.items.length} 品目</span>
                                                        <span className="text-slate-300">|</span>
                                                        <span>{new Date(order.orderDate).toLocaleString('ja-JP')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === "承認待ち" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                                    order.status === "承認済み" ? "bg-green-50 text-green-700 border border-green-200" :
                                                        "bg-red-50 text-red-700 border border-red-200"
                                                    }`}>
                                                    {order.status}
                                                </span>

                                                <Link
                                                    href={`/admin?id=${order.id}`} // Main approval console
                                                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-slate-200"
                                                >
                                                    詳細・承認
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                        <p className="font-bold text-lg mb-2">左側からクールを選択してください</p>
                        <p className="text-sm">定期請求の内容が表示されます</p>
                    </div>
                )}
            </div>
        </div>
    );
}
