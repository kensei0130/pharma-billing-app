"use client";

import { useState } from "react";
import { addDrug, updateDrug, deleteDrug } from "@/app/actions/drugs";

type Drug = {
    id: number;
    name: string;
    unit: string;
    category: string | null;
    furigana: string | null;
    isInactive: boolean | null;
};

export default function DrugManager({ initialDrugs }: { initialDrugs: Drug[] }) {
    const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Filter drugs based on search term
    const filteredDrugs = initialDrugs.filter(drug =>
        (drug.name.includes(searchTerm) || (drug.furigana && drug.furigana.includes(searchTerm))) &&
        !drug.isInactive // Optionally show inactive ones with a toggle? For now hide.
    );

    const handleSelect = (drug: Drug) => {
        setSelectedDrug(drug);
        // Scroll to form on mobile if needed, or just let them see the side panel
    };

    const handleCreateNew = () => {
        setSelectedDrug(null);
    };

    // Wrap actions to handle form reset or closing
    // Since we use server actions with revalidatePath, the list will update automatically via props from page.tsx (RSC)
    // But we might want to reset the form or selection.

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
            {/* LEFT COLUMN: List & Search */}
            <div className="w-full md:w-1/3 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-slate-700">薬品一覧</h2>
                        <button
                            onClick={handleCreateNew}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-full hover:bg-indigo-700 transition-colors shadow-sm flex items-center"
                        >
                            <span className="mr-1">+</span> 新規登録
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="薬品名・ふりがなで検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredDrugs.length > 0 ? (
                        <ul className="divide-y divide-slate-100">
                            {filteredDrugs.map((drug) => (
                                <li key={drug.id}>
                                    <button
                                        onClick={() => handleSelect(drug)}
                                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between group ${selectedDrug?.id === drug.id ? "bg-indigo-50 border-l-4 border-indigo-500" : "border-l-4 border-transparent"
                                            }`}
                                    >
                                        <div className="min-w-0">
                                            <div className={`text-sm font-medium truncate ${selectedDrug?.id === drug.id ? "text-indigo-900" : "text-slate-700"}`}>
                                                {drug.name}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate mt-0.5">
                                                {drug.furigana || "-"}
                                            </div>
                                        </div>
                                        <div className="ml-2 flex-shrink-0 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-slate-200">
                                            {drug.category || "未分類"}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            薬品が見つかりません
                        </div>
                    )}
                </div>
                <div className="p-2 border-t border-slate-100 text-center text-xs text-slate-400 bg-slate-50/50">
                    全 {filteredDrugs.length} 件
                </div>
            </div>

            {/* RIGHT COLUMN: Edit Form */}
            <div className="w-full md:w-2/3 flex flex-col">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            {selectedDrug ? (
                                <>
                                    <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">✎</span>
                                    薬品情報の編集
                                </>
                            ) : (
                                <>
                                    <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-3 text-sm">＋</span>
                                    新規薬品登録
                                </>
                            )}
                        </h3>
                        {selectedDrug && (
                            <span className="text-xs font-mono text-slate-400 bg-white px-2 py-1 border border-slate-200 rounded">
                                ID: {selectedDrug.id}
                            </span>
                        )}
                    </div>

                    <div className="p-6 md:p-8 overflow-y-auto flex-1">
                        <form
                            action={async (formData) => {
                                if (selectedDrug) {
                                    // Update
                                    await updateDrug(selectedDrug.id, formData);
                                    // Keep selected? Or clear? Keeping it allows verify updates visually.
                                } else {
                                    // Create
                                    await addDrug(formData);
                                    // Clear form by ensuring selectedDrug remains null (or form reset logic)
                                    // Usually easier to clear form manually if using uncontrolled inputs, but key prop trick helps.
                                    setSelectedDrug(null); // Force re-render of form with null state if logic changes, though key={selectedDraft?.id} handles it
                                }
                            }}
                            key={selectedDrug ? selectedDrug.id : 'new'} // Checks if we switched items to reset form
                            className="max-w-xl mx-auto space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        薬品名 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        defaultValue={selectedDrug?.name || ""}
                                        required
                                        className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 shadow-sm"
                                        placeholder="例: ロキソニン錠 60mg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        ふりがな
                                    </label>
                                    <input
                                        type="text"
                                        name="furigana"
                                        defaultValue={selectedDrug?.furigana || ""}
                                        className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 shadow-sm"
                                        placeholder="例: ろきそにん"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        単位 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="unit"
                                        defaultValue={selectedDrug?.unit || ""}
                                        required
                                        className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 shadow-sm"
                                        placeholder="例: 錠, 本, 枚"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        カテゴリ
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="category"
                                            defaultValue={selectedDrug?.category || "内服薬"}
                                            className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 shadow-sm appearance-none"
                                        >
                                            <option value="内服薬">内服薬</option>
                                            <option value="外用薬">外用薬</option>
                                            <option value="注射薬">注射薬</option>
                                            <option value="輸液">輸液</option>
                                            <option value="その他">その他</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center gap-4">
                                <button
                                    type="submit"
                                    className={`flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${selectedDrug
                                            ? "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 shadow-indigo-200"
                                            : "bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-green-200"
                                        }`}
                                >
                                    {selectedDrug ? "変更を保存する" : "新規登録する"}
                                </button>

                                {selectedDrug && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (confirm("本当にこの薬品を削除（無効化）しますか？")) {
                                                await deleteDrug(selectedDrug.id);
                                                setSelectedDrug(null);
                                            }
                                        }}
                                        className="px-6 py-3 border border-red-200 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                    >
                                        削除
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
