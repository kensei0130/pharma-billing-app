import { auth } from "@/auth";
import { getDrugs } from "@/db/queries";
import { addDrug } from "@/app/actions/drugs";
import DrugRow from "./DrugRow";

export default async function DrugsPage() {
    const session = await auth();
    const drugs = await getDrugs();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">薬品マスタ管理</h2>
                    <p className="text-slate-500 mt-1">請求可能な薬品の登録・編集を行います。</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">薬品名 / ふりがな</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">カテゴリ</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">単位</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {drugs.map((drug) => (
                                    <DrugRow key={drug.id} drug={drug} />
                                ))}
                                {drugs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                                            薬品が登録されていません
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Form Section */}
                <div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">新規薬品登録</h3>
                        <form action={addDrug} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">薬品名 <span className="text-red-500">*</span></label>
                                <input type="text" name="name" required className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="例: ロキソニン錠 60mg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ふりがな</label>
                                <input type="text" name="furigana" className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="例: ろきそにん" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">カテゴリ</label>
                                <select name="category" className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
                                    <option value="内服薬">内服薬</option>
                                    <option value="外用薬">外用薬</option>
                                    <option value="注射薬">注射薬</option>
                                    <option value="輸液">輸液</option>
                                    <option value="その他">その他</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">単位 <span className="text-red-500">*</span></label>
                                <input type="text" name="unit" required className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" placeholder="例: 錠, 本, 枚" />
                            </div>
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                登録する
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
