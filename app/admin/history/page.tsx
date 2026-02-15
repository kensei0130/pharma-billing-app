import { auth } from "@/auth";
import { getHistoryOrders } from "@/db/queries";
import CsvExportButton from "./CsvExportButton";

export default async function HistoryPage() {
    const session = await auth();
    const historyOrders = await getHistoryOrders();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">請求履歴</h2>
                    <p className="text-slate-500 mt-1">過去の承認・却下済み請求を確認できます。</p>
                </div>
                <div>
                    <CsvExportButton orders={historyOrders} />
                </div>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">請求日</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">病棟</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">種別</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ステータス</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">承認者/日</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {historyOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-sm text-slate-900">
                                    {new Date(order.orderDate).toLocaleString('ja-JP')}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                    {order.wardName}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.type === '緊急' ? 'bg-red-100 text-red-800' :
                                            order.type === '定時' ? 'bg-green-100 text-green-800' : 'bg-indigo-100 text-indigo-800'
                                        }`}>
                                        {order.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === '承認済み' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    <div>{order.approvedBy}</div>
                                    <div className="text-xs">{order.approvedDate ? new Date(order.approvedDate).toLocaleString('ja-JP') : '-'}</div>
                                </td>
                            </tr>
                        ))}
                        {historyOrders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                    履歴がありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
