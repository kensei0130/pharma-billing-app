"use client";

import { useEffect, useState, useCallback } from "react";
import { getMonitorOrders, getOrderDetails } from "@/app/actions/orders";

// We need a modal component. Reuse or create simple one.
// Reuse 'ApprovalOrderDetail' from 'AdminApprovalConsole' if possible?
// It might be coupled. Let's create a simplified version or reuse.
import ApprovalOrderDetail from "../components/ApprovalOrderDetail";

// Type definitions
// We need to match what ApprovalOrderDetail expects.
// It expects flattened items with drugName/drugUnit.
type Order = Awaited<ReturnType<typeof getMonitorOrders>>["unapproved"][number];

export default function MonitorClient({
    initialData
}: {
    initialData: { unapproved: Order[]; approved: Order[] }
}) {
    const [orders, setOrders] = useState(initialData);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const data = await getMonitorOrders();
            setOrders(data);
        } catch (error) {
            console.error("Failed to refresh monitor data", error);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // Polling effect
    useEffect(() => {
        const interval = setInterval(refreshData, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, [refreshData]);

    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order);
    };

    const handleCloseModal = () => {
        setSelectedOrder(null);
        refreshData(); // Refresh on close to show updated status
    };

    const handleActionComplete = async () => {
        setSelectedOrder(null); // Close modal immediately upon action
        await refreshData(); // Then refresh the background list
    };

    const StatusCard = ({ order, statusType }: { order: Order; statusType: "pending" | "ready" }) => {
        // Calculate elapsed time or approved time
        const timeDisplay = statusType === "pending"
            ? new Date(order.orderDate).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
            : order.approvedDate
                ? new Date(order.approvedDate).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                : "--:--";

        return (
            <button
                onClick={() => handleOrderClick(order)}
                className={`w-full text-left p-4 rounded-xl shadow-sm border transition-all hover:scale-[1.02] ${statusType === "pending"
                    ? "bg-white border-yellow-200 hover:shadow-yellow-100"
                    : "bg-white border-green-200 hover:shadow-green-100"
                    }`}
            >
                <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${order.type === "緊急" ? "bg-red-100 text-red-700" :
                        order.type === "定時" ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-700"
                        }`}>
                        {order.type}
                    </span>
                    <span className="text-2xl font-black text-slate-700 font-mono">
                        {timeDisplay}
                    </span>
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-lg font-bold text-slate-800 leading-tight">
                            {order.ward.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            ID: {order.requestId || order.id}
                        </div>
                    </div>
                    <span className="text-xl font-bold text-slate-400">
                        {order.items.length} <span className="text-xs">点</span>
                    </span>
                </div>
            </button>
        );
    };

    return (
        <div className="h-[calc(100vh-4rem)] bg-slate-100 flex overflow-hidden">
            {/* Left Column: Pending */}
            <div className="w-1/2 flex flex-col border-r border-slate-200 bg-yellow-50/30">
                <div className="p-4 bg-yellow-100/50 border-b border-yellow-200 flex justify-between items-center">
                    <h2 className="text-xl font-black text-yellow-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></span>
                        確認中 / Preparing
                    </h2>
                    <span className="bg-white px-3 py-1 rounded-full text-yellow-700 font-bold border border-yellow-200">
                        {orders.unapproved.length}
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {orders.unapproved.map(order => (
                        <StatusCard key={order.id} order={order} statusType="pending" />
                    ))}
                    {orders.unapproved.length === 0 && (
                        <div className="h-full flex items-center justify-center text-slate-400 font-bold opacity-50">
                            No Pending Orders
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Ready */}
            <div className="w-1/2 flex flex-col bg-green-50/30">
                <div className="p-4 bg-green-100/50 border-b border-green-200 flex justify-between items-center">
                    <h2 className="text-xl font-black text-green-800 uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        受取可能 / Ready
                    </h2>
                    <span className="bg-white px-3 py-1 rounded-full text-green-700 font-bold border border-green-200">
                        {orders.approved.length}
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {orders.approved.map(order => (
                        <StatusCard key={order.id} order={order} statusType="ready" />
                    ))}
                    {orders.approved.length === 0 && (
                        <div className="h-full flex items-center justify-center text-slate-400 font-bold opacity-50">
                            No Ready Orders
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">
                                    {selectedOrder.ward.name}
                                    <span className="ml-2 text-sm font-normal text-slate-500">
                                        ({selectedOrder.type})
                                    </span>
                                </h3>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-200 rounded-full">
                                <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0">
                            {/* Map the order items to match ApprovalOrderDetail expectations */}
                            <ApprovalOrderDetail
                                order={{
                                    ...selectedOrder,
                                    items: selectedOrder.items.map(item => ({
                                        ...item,
                                        drugName: item.drug.name,
                                        drugUnit: item.drug.unit,
                                        approvedQuantity: item.approvedQuantity || 0
                                    }))
                                }}
                                onUpdate={handleActionComplete}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
