"use client";

import { useState } from "react";
import { cancelOrder } from "@/app/actions/orders";

type Order = {
    id: number;
    orderDate: string;
    type: string | null;
    status: string | null;
    approvedBy: string | null;
    approvedDate: string | null;
    items?: {
        drug: { name: string };
        quantity: number;
        comment?: string | null;
    }[];
};

export default function WardOrderHistory({ orders, onEdit }: { orders: Order[], onEdit: (id: number) => void }) {
    const [isLoading, setIsLoading] = useState(false);
    // Date Range Filter State
    const todayStr = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState<string>(todayStr);
    const [endDate, setEndDate] = useState<string>(todayStr);

    const handleCancel = async (id: number) => {
        if (!confirm("本当にこの請求をキャンセルしますか？")) return;
        setIsLoading(true);
        const result = await cancelOrder(id);
        setIsLoading(false);
        if (!result.success) {
            alert(result.message);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (!startDate && !endDate) return true;

        const orderDate = new Date(order.orderDate);
        orderDate.setHours(0, 0, 0, 0); // Compare dates only

        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (orderDate < start) return false;
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(0, 0, 0, 0);
            if (orderDate > end) return false;
        }

        return true;
    });

    return (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col min-[1200px]:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center">
                    <span className="bg-slate-600 text-white p-1.5 rounded-md mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                    </span>
                    直近の請求履歴
                </h2>

                {/* Date Range Filter Controls */}
                <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-2 shadow-sm">
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-500">From:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-sm border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <span className="text-slate-400">~</span>
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-500">To:</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-sm border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button
                            onClick={() => { setStartDate(""); setEndDate(""); }}
                            className="ml-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                        >
                            クリア
                        </button>
                    )}
                </div>
            </div>

            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">請求日時</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">内容</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">種別</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">ステータス</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">操作</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-sm text-slate-900 whitespace-nowrap">
                                {new Date(order.orderDate).toLocaleString('ja-JP')}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                                {order.items && order.items.length > 0 ? (
                                    <>
                                        <span className="font-medium">{order.items[0].drug.name}</span>
                                        {order.items.length > 1 && (
                                            <span className="text-slate-400 ml-1 text-xs"> 他{order.items.length - 1}剤</span>
                                        )}
                                        {/* Show comment indicator if any item has a comment */}
                                        {order.items.some(i => i.comment) && (
                                            <div className="mt-1 flex items-start gap-1">
                                                <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200 flex items-center">
                                                    <span className="mr-1">📝</span>
                                                    {order.items.find(i => i.comment)?.comment}
                                                    {order.items.filter(i => i.comment).length > 1 && "..."}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-slate-400 italic">内容なし</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.type === '返却' ? 'bg-red-100 text-red-800' :
                                    order.type === '定時' ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                    {order.type || '臨時'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === '承認済み' ? 'bg-green-100 text-green-800' :
                                    order.status === '却下' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {order.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {order.status === '承認待ち' && (
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            onClick={() => onEdit(order.id)}
                                            disabled={isLoading}
                                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium hover:underline disabled:opacity-50"
                                        >
                                            編集
                                        </button>
                                        <button
                                            onClick={() => handleCancel(order.id)}
                                            disabled={isLoading}
                                            className="text-red-400 hover:text-red-600 text-sm font-medium hover:underline disabled:opacity-50"
                                        >
                                            キャンセル
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-500 flex flex-col items-center justify-center">
                                <span className="text-2xl mb-2">📭</span>
                                {(!startDate && !endDate) ? "履歴はありません" : "選択した期間の履歴はありません"}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
