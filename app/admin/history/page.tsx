import { auth } from "@/auth";
import { getHistoryOrders } from "@/db/queries";
import CsvExportButton from "./CsvExportButton";

export default async function HistoryPage() {
    const session = await auth();
    const historyOrders = await getHistoryOrders();

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col space-y-6">
            {/* Header Area */}
            <div className="flex items-end justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-xl text-white shadow-lg shadow-slate-200">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">請求履歴</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-bold text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        全 {historyOrders.length} 件
                    </div>
                    <CsvExportButton orders={historyOrders} />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">請求日時</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">病棟</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">種別</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ステータス</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">承認詳細</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {historyOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">
                                                {new Date(order.orderDate).toLocaleDateString('ja-JP')}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium">
                                                {new Date(order.orderDate).toLocaleTimeString('ja-JP')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
                                                {order.wardName.charAt(0)}
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{order.wardName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${order.type === '緊急' ? 'bg-red-50 text-red-700 border-red-100' :
                                            order.type === '定時' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                            }`}>
                                            {order.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold ${order.status === '承認済み' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${order.status === '承認済み' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                {order.approvedBy || "Unknown"}
                                            </span>
                                            <span className="text-[10px] text-slate-400 mt-0.5">
                                                {order.approvedDate ? new Date(order.approvedDate).toLocaleString('ja-JP') : '-'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {historyOrders.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 bg-slate-50/30">
                                        <div className="flex flex-col items-center">
                                            <span className="text-4xl mb-4 opacity-20">📜</span>
                                            <p className="font-bold">履歴データが見つかりません</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
