import { auth } from "@/auth";
import { getPeriodicOrdersByDate } from "@/app/actions/periodic";
import { formatDate } from "@/lib/date-utils";
import Link from "next/link";
import PeriodicDetailClient from "./PeriodicDetailClient";

export default async function PeriodicDetailPage({ params }: { params: { date: string } }) {
    const session = await auth();
    const decodedDate = decodeURIComponent(params.date);
    const orders = await getPeriodicOrdersByDate(decodedDate);
    const date = new Date(decodedDate);

    // Calculate Summary Stats
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === "承認待ち").length;
    const totalItems = orders.reduce((sum, o) => sum + o.items.length, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <Link href="/admin/periodic" className="hover:text-indigo-600 hover:underline">定期請求管理</Link>
                        <span>/</span>
                        <span>詳細</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        📅 {formatDate(date)} 払出分
                        {pendingOrders > 0 && (
                            <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full animate-pulse">
                                未承認 {pendingOrders} 件
                            </span>
                        )}
                    </h2>
                </div>
                <PeriodicDetailClient dateStr={decodedDate} hasPending={pendingOrders > 0} />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-sm font-bold text-slate-500 mb-1">総請求数</div>
                    <div className="text-3xl font-bold text-slate-800">{totalOrders} <span className="text-sm font-normal text-slate-400">病棟</span></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-sm font-bold text-slate-500 mb-1">未承認</div>
                    <div className="text-3xl font-bold text-indigo-600">{pendingOrders} <span className="text-sm font-normal text-slate-400">件</span></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-sm font-bold text-slate-500 mb-1">総アイテム数</div>
                    <div className="text-3xl font-bold text-slate-800">{totalItems} <span className="text-sm font-normal text-slate-400">個</span></div>
                </div>
            </div>

            {/* Order List */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">
                    請求病棟一覧
                </div>
                {orders.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        このクールの請求はまだありません
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {orders.map(order => (
                            <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center">
                                        {order.ward.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{order.ward.name}</div>
                                        <div className="text-xs text-slate-500">
                                            {order.items.length} 品目 | {new Date(order.orderDate).toLocaleString('ja-JP')} 請求
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === "承認待ち" ? "bg-blue-100 text-blue-700" :
                                            order.status === "承認済み" ? "bg-green-100 text-green-700" :
                                                "bg-red-100 text-red-700"
                                        }`}>
                                        {order.status}
                                    </span>

                                    <Link
                                        href={`/admin?id=${order.id}`}
                                        className="px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm font-bold hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        詳細・承認へ
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
