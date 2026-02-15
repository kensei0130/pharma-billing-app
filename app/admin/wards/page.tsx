import { auth } from "@/auth";
import { db } from "@/db";
import { wards } from "@/db/schema";
import { addWard, deleteWard } from "@/app/actions/wards";
import { eq } from "drizzle-orm";
import WardRow from "./WardRow";

async function getWards() {
    // Show all wards including inactive ones? Or just active? 
    // Usually for master management we want to see active ones, maybe toggle for inactive.
    // For now, let's just show active ones like drugs.
    return await db.select().from(wards).where(eq(wards.isInactive, false));
}

export default async function WardsPage() {
    const session = await auth();
    const wardList = await getWards();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">病棟マスタ管理</h2>
                    <p className="text-slate-500 mt-1">システムを利用する病棟の登録・編集を行います。</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">病棟名</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">パスワード</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {wardList.map((ward) => (
                                    <WardRow key={ward.id} ward={ward} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Form Section */}
                <div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">新規病棟登録</h3>
                        <form action={addWard} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">病棟ID <span className="text-red-500">*</span></label>
                                <input type="text" name="id" required className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="例: 3" />
                                <p className="text-xs text-slate-400 mt-1">※一意のIDを指定してください</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">病棟名 <span className="text-red-500">*</span></label>
                                <input type="text" name="name" required className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="例: 小児科病棟" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">パスワード <span className="text-red-500">*</span></label>
                                <input type="text" name="password" required className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="英数字推奨" />
                            </div>
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                登録する
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div >
    );
}
