"use client";

import { useState } from "react";
import { addWard, updateWard, deleteWard } from "@/app/actions/wards";

type Ward = {
    id: string; // Ward ID is string (e.g. "3")
    name: string;
    role: string;
    password?: string | null; // Password might not be returned for security, but here we might need to set it
    isInactive: boolean | null;
};

export default function WardManager({ initialWards }: { initialWards: Ward[] }) {
    const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Filter wards based on search term
    const filteredWards = initialWards.filter(ward =>
        (ward.name.includes(searchTerm) || ward.id.includes(searchTerm)) &&
        !ward.isInactive // Optionally show inactive ones with a toggle? For now hide.
    );

    const handleSelect = (ward: Ward) => {
        setSelectedWard(ward);
    };

    const handleCreateNew = () => {
        setSelectedWard(null);
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
            {/* LEFT COLUMN: List & Search */}
            <div className="w-full md:w-1/3 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-slate-700">病棟一覧</h2>
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
                            placeholder="病棟名・IDで検索..."
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
                    {filteredWards.length > 0 ? (
                        <ul className="divide-y divide-slate-100">
                            {filteredWards.map((ward) => (
                                <li key={ward.id}>
                                    <button
                                        onClick={() => handleSelect(ward)}
                                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between group ${selectedWard?.id === ward.id ? "bg-indigo-50 border-l-4 border-indigo-500" : "border-l-4 border-transparent"
                                            }`}
                                    >
                                        <div className="min-w-0">
                                            <div className={`text-sm font-medium truncate ${selectedWard?.id === ward.id ? "text-indigo-900" : "text-slate-700"}`}>
                                                {ward.name}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate mt-0.5">
                                                ID: {ward.id}
                                            </div>
                                        </div>
                                        <div className="ml-2 flex-shrink-0">
                                            <svg className={`w-5 h-5 ${selectedWard?.id === ward.id ? "text-indigo-400" : "text-slate-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            病棟が見つかりません
                        </div>
                    )}
                </div>
                <div className="p-2 border-t border-slate-100 text-center text-xs text-slate-400 bg-slate-50/50">
                    全 {filteredWards.length} 件
                </div>
            </div>

            {/* RIGHT COLUMN: Edit Form */}
            <div className="w-full md:w-2/3 flex flex-col">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            {selectedWard ? (
                                <>
                                    <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">✎</span>
                                    病棟情報の編集
                                </>
                            ) : (
                                <>
                                    <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-3 text-sm">＋</span>
                                    新規病棟登録
                                </>
                            )}
                        </h3>
                        {selectedWard && (
                            <span className="text-xs font-mono text-slate-400 bg-white px-2 py-1 border border-slate-200 rounded">
                                SYSTEM ID: {selectedWard.id}
                            </span>
                        )}
                    </div>

                    <div className="p-6 md:p-8 overflow-y-auto flex-1">
                        <form
                            action={async (formData) => {
                                if (selectedWard) {
                                    // Update
                                    await updateWard(selectedWard.id, formData);
                                } else {
                                    // Create
                                    await addWard(formData);
                                    setSelectedWard(null);
                                }
                            }}
                            key={selectedWard ? selectedWard.id : 'new'}
                            className="max-w-xl mx-auto space-y-6"
                        >
                            {/* ID Field - ReadOnly when editing */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    病棟ID (ログインID) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="id"
                                    defaultValue={selectedWard?.id || ""}
                                    readOnly={!!selectedWard}
                                    required
                                    className={`w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 shadow-sm ${selectedWard ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
                                    placeholder="例: 3"
                                />
                                {!selectedWard && (
                                    <p className="text-xs text-slate-500 mt-1">※登録後にIDは変更できません</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    病棟名 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    defaultValue={selectedWard?.name || ""}
                                    required
                                    className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 shadow-sm"
                                    placeholder="例: 小児科病棟"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    パスワード <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="password"
                                    defaultValue={selectedWard?.password || ""} // Note: Password usually hashed, might be empty coming back
                                    required
                                    className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 shadow-sm"
                                    placeholder="英数字推奨"
                                />
                                {selectedWard && (
                                    <p className="text-xs text-slate-500 mt-1">※変更する場合のみ新しいパスワードを入力してください（現在は表示用にそのまま入れています）</p>
                                )}
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center gap-4">
                                <button
                                    type="submit"
                                    className={`flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${selectedWard
                                            ? "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 shadow-indigo-200"
                                            : "bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-green-200"
                                        }`}
                                >
                                    {selectedWard ? "変更を保存する" : "新規登録する"}
                                </button>

                                {selectedWard && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (confirm("本当にこの病棟を削除（無効化）しますか？")) {
                                                await deleteWard(selectedWard.id);
                                                setSelectedWard(null);
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
