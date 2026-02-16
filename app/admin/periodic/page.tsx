import { auth } from "@/auth";
import { getPeriodicCycles } from "@/app/actions/periodic";
import Link from "next/link";
import { formatDate } from "@/lib/date-utils";

export default async function PeriodicAdminPage() {
    const session = await auth();
    const cycles = await getPeriodicCycles();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">定期請求管理</h2>
                    <p className="text-slate-500 mt-1">週ごとの定期請求（クール）単位で承認・管理を行います。</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cycles.map((cycle) => {
                    const date = new Date(cycle.date);
                    const isUpcoming = cycle.status === "受付中";

                    return (
                        <Link
                            key={cycle.date}
                            href={`/admin/periodic/${encodeURIComponent(cycle.date)}`}
                            className={`group block p-6 rounded-2xl border transition-all hover:shadow-md ${isUpcoming
                                    ? "bg-white border-indigo-100 hover:border-indigo-300"
                                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${cycle.status === "受付中" ? "bg-green-100 text-green-700" :
                                        cycle.status === "締切後" ? "bg-amber-100 text-amber-700" :
                                            "bg-slate-200 text-slate-600"
                                    }`}>
                                    {cycle.status}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                    {date.getFullYear()}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                                📅 {formatDate(date)}
                                <span className="text-sm font-normal text-slate-500">払出分</span>
                            </h3>

                            <div className="mt-6 flex items-end justify-between">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">請求数</span>
                                    <span className="text-2xl font-bold text-slate-700">{cycle.orderCount}</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
