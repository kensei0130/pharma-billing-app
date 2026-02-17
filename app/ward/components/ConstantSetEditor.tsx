"use client";

import { useState, useTransition, useEffect } from "react";
import { createConstantSet, deleteConstantSet, updateConstantSetItems } from "@/app/actions/constant-sets";
import { useRouter } from "next/navigation";

// Types
type Drug = {
    id: number;
    name: string;
    unit: string;
    category: string | null;
    furigana: string | null;
    allowComment: boolean;
};

type ConstantDrug = {
    id: number; // item id
    drugId: number;
    name: string;
    quantity: number;
    unit: string;
    setId: number;
    setName: string;
};

type ConstantSet = {
    id: number;
    wardId: string;
    name: string;
};

export default function ConstantSetEditor({
    wardId,
    drugs,
    constantDrugs,
    initialSets
}: {
    wardId: string;
    drugs: Drug[];
    constantDrugs: ConstantDrug[];
    initialSets: ConstantSet[];
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Use sets from props, but updated via router refresh (server component will re-pass new props)
    const sets = initialSets.sort((a, b) => a.id - b.id);

    // State
    const [selectedSetId, setSelectedSetId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newSetName, setNewSetName] = useState("");

    // Editor State
    const [editingItems, setEditingItems] = useState<{ drugId: number; quantity: number }[]>([]);
    const [drugSearchQuery, setDrugSearchQuery] = useState("");

    // Auto-select first set if none selected and sets exist
    useEffect(() => {
        // If selectedSetId is null and we have sets, select first
        if (selectedSetId === null && sets.length > 0) {
            handleSetChange(sets[0].id);
        }
        // If we just created a set (sets length increased), select the new one (last one by ID usually)
        // For now, simpler logic: just ensure something is selected if available
    }, [sets.length]);

    // Sync when switching sets
    const handleSetChange = (setId: number) => {
        setSelectedSetId(setId);
        const items = constantDrugs
            .filter(d => d.setId === setId)
            .map(d => ({ drugId: d.drugId, quantity: d.quantity }));
        setEditingItems(items);
        setDrugSearchQuery(""); // Reset search
        setSelectedCategory(""); // Reset category
    };

    // Actions
    const handleCreateSet = async () => {
        if (!newSetName.trim()) return;

        startTransition(async () => {
            const result = await createConstantSet(wardId, newSetName);
            if (result.success) {
                setNewSetName("");
                setIsCreating(false);
                router.refresh();
                // Note: selection update is handled by useEffect above when new set appears
            } else {
                alert(result.message);
            }
        });
    };

    const handleDeleteSet = async () => {
        if (!selectedSetId) return;
        if (!confirm("本当にこのセットを削除しますか？\n削除すると復元できません。")) return;

        startTransition(async () => {
            await deleteConstantSet(selectedSetId);
            setSelectedSetId(null);
            router.refresh();
        });
    };

    const handleSaveItems = async () => {
        if (!selectedSetId) return;
        startTransition(async () => {
            const result = await updateConstantSetItems(selectedSetId, editingItems);
            if (result.success) {
                alert("セット内容を保存しました ✅");
                router.refresh();
            } else {
                alert("保存に失敗しました: " + result.message);
            }
        });
    };

    // Item Management
    const handleAddItem = (drug: Drug) => {
        if (editingItems.some(i => i.drugId === drug.id)) return; // Already exists
        setEditingItems([...editingItems, { drugId: drug.id, quantity: 1 }]); // Default qty 1
        setDrugSearchQuery(""); // Clear search to show "added" feeling
    };

    const handleRemoveItem = (drugId: number) => {
        setEditingItems(editingItems.filter(i => i.drugId !== drugId));
    };

    const handleQuantityChange = (drugId: number, qty: number) => {
        setEditingItems(editingItems.map(i => i.drugId === drugId ? { ...i, quantity: qty } : i));
    };

    const handleMoveItem = (index: number, direction: 'up' | 'down') => {
        const newItems = [...editingItems];
        if (direction === 'up') {
            if (index === 0) return;
            [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        } else {
            if (index === newItems.length - 1) return;
            [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        }
        setEditingItems(newItems);
    };

    // Category Logic
    const [selectedCategory, setSelectedCategory] = useState("");
    const categories = Array.from(new Set(drugs.map(d => d.category).filter(Boolean))) as string[];

    // Filter drugs for search
    const filteredDrugs = drugSearchQuery
        ? drugs.filter(d =>
            d.name.includes(drugSearchQuery) ||
            (d.furigana && d.furigana.includes(drugSearchQuery))
        ).slice(0, 10) // Limit results
        : [];

    const categoryDrugs = selectedCategory
        ? drugs.filter(d => d.category === selectedCategory)
        : [];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col min-[1200px]:flex-row overflow-hidden">

            {/* Sidebar: Set List */}
            <div className="w-full min-[1200px]:w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                    <h3 className="font-bold text-slate-700">セット一覧</h3>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-colors"
                    >
                        + 新規
                    </button>
                </div>

                {isCreating && (
                    <div className="p-3 bg-indigo-50 border-b border-indigo-100 animate-in fade-in">
                        <input
                            type="text"
                            value={newSetName}
                            onChange={(e) => setNewSetName(e.target.value)}
                            placeholder="セット名..."
                            className="w-full text-sm border border-indigo-300 rounded px-2 py-1 mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateSet}
                                disabled={isPending}
                                className="flex-1 bg-indigo-600 text-white text-xs py-1 rounded hover:bg-indigo-700"
                            >
                                {isPending ? "..." : "作成"}
                            </button>
                            <button
                                onClick={() => setIsCreating(false)}
                                className="flex-1 bg-white text-slate-600 text-xs py-1 rounded border border-slate-300 hover:bg-slate-50"
                            >
                                中止
                            </button>
                        </div>
                    </div>
                )}

                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {sets.length === 0 && !isCreating && (
                        <div className="text-center text-xs text-slate-400 py-4">セットがありません</div>
                    )}
                    {sets.map(set => (
                        <button
                            key={set.id}
                            onClick={() => handleSetChange(set.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex justify-between group ${selectedSetId === set.id
                                ? "bg-white border border-indigo-200 shadow-sm text-indigo-700 font-bold"
                                : "text-slate-600 hover:bg-slate-100"
                                } `}
                        >
                            <span>{set.name}</span>
                            {selectedSetId === set.id && (
                                <span className="text-xs bg-indigo-100 text-indigo-800 px-1.5 rounded-full">
                                    {constantDrugs.filter(d => d.setId === set.id).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content: Editor */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedSetId ? (
                    <>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {sets.find(s => s.id === selectedSetId)?.name}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {editingItems.length} 品目の薬品が登録されています
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDeleteSet}
                                    disabled={isPending}
                                    className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm transition-colors"
                                >
                                    🗑️ 削除
                                </button>
                                <button
                                    onClick={handleSaveItems}
                                    disabled={isPending}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md shadow-indigo-100 transition-all flex items-center"
                                >
                                    {isPending ? (
                                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                    ) : (
                                        <span className="mr-2">💾</span>
                                    )}
                                    保存する
                                </button>
                            </div>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            {/* Drug Addition Area */}
                            <div className="mb-8">
                                <div className="flex flex-col min-[1200px]:flex-row gap-6 items-start">
                                    {/* Search Section */}
                                    <div className="flex-1 w-full relative">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">① 検索して追加</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                value={drugSearchQuery}
                                                onChange={(e) => setDrugSearchQuery(e.target.value)}
                                                placeholder="薬品名・フリガナで検索..."
                                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm text-sm"
                                            />

                                            {/* Search Results Dropdown */}
                                            {drugSearchQuery && (
                                                <div className="absolute w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-hidden z-20">
                                                    {filteredDrugs.length > 0 ? (
                                                        filteredDrugs.map(drug => {
                                                            const isAdded = editingItems.some(i => i.drugId === drug.id);
                                                            return (
                                                                <button
                                                                    key={drug.id}
                                                                    onClick={() => handleAddItem(drug)}
                                                                    disabled={isAdded}
                                                                    className={`w-full text-left px-4 py-3 hover:bg-indigo-50 flex justify-between items-center transition-colors border-b border-slate-50 last:border-0 ${isAdded ? "opacity-50 cursor-not-allowed bg-slate-50" : ""} `}
                                                                >
                                                                    <div>
                                                                        <div className="font-bold text-slate-800">{drug.name}</div>
                                                                        <div className="text-xs text-slate-500">{drug.category || "未分類"}</div>
                                                                    </div>
                                                                    {isAdded ? (
                                                                        <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded">追加済</span>
                                                                    ) : (
                                                                        <span className="text-indigo-600 font-bold">+ 追加</span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="p-4 text-center text-slate-500 text-sm">見つかりませんでした</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="hidden min-[1200px]:block w-px bg-slate-200 self-stretch my-2"></div>

                                    {/* Category Section */}
                                    <div className="flex-1 w-full">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">② カテゴリから選択</label>
                                        <div className="flex flex-col gap-3">
                                            <select
                                                className="w-full border border-slate-300 rounded-xl px-3 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50/50"
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                            >
                                                <option value="">カテゴリを選択...</option>
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>

                                            <select
                                                className="w-full border border-slate-300 rounded-xl px-3 py-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                                                disabled={!selectedCategory}
                                                value=""
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (!val) return;
                                                    const d = drugs.find(drug => drug.id === parseInt(val));
                                                    if (d) {
                                                        handleAddItem(d);
                                                        // Optional: Provide feedback or leave selection as is (it resets due to value="")
                                                    }
                                                }}
                                            >
                                                <option value="">{selectedCategory ? (categoryDrugs.length > 0 ? "▼ 薬品を選択して追加" : "該当する薬品がありません") : "カテゴリ未選択"}</option>
                                                {categoryDrugs.map(d => {
                                                    const isAdded = editingItems.some(i => i.drugId === d.id);
                                                    return (
                                                        <option key={d.id} value={d.id} disabled={isAdded} className={isAdded ? "text-slate-400 bg-slate-50" : "font-medium"}>
                                                            {d.name} {isAdded ? "(追加済)" : ""}
                                                        </option>
                                                    )
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Item List */}
                            <div className="space-y-3">
                                {editingItems.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                                        <span className="text-4xl block mb-2">💊</span>
                                        <p className="text-slate-500 font-medium">薬品が登録されていません</p>
                                        <p className="text-xs text-slate-400 mt-1">上の検索ボックスから薬品を追加してください</p>
                                    </div>
                                ) : (
                                    editingItems.map((item, index) => {
                                        const drug = drugs.find(d => d.id === item.drugId);
                                        return (
                                            <div key={item.drugId} className="flex items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 transition-colors group">
                                                {/* Reorder Buttons */}
                                                <div className="flex flex-col mr-4 gap-1">
                                                    <button
                                                        onClick={() => handleMoveItem(index, 'up')}
                                                        disabled={index === 0}
                                                        className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-300"
                                                    >
                                                        ▲
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveItem(index, 'down')}
                                                        disabled={index === editingItems.length - 1}
                                                        className="text-slate-300 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-300"
                                                    >
                                                        ▼
                                                    </button>
                                                </div>

                                                <div className="flex-1">
                                                    <div className="font-bold text-slate-800">{drug?.name}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{drug?.category}</div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                                        <span className="text-xs text-slate-500 px-2 font-bold">定数</span>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => handleQuantityChange(item.drugId, parseInt(e.target.value) || 0)}
                                                            className="w-20 text-right bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            min="0"
                                                        />
                                                        <span className="text-xs text-slate-500 px-2">{drug?.unit}</span>
                                                    </div>

                                                    <button
                                                        onClick={() => handleRemoveItem(item.drugId)}
                                                        className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                        title="削除"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                        <span className="text-6xl mb-4">👈</span>
                        <p className="font-medium text-lg">左側のリストからセットを選択するか</p>
                        <p>「+ 新規」ボタンから新しいセットを作成してください</p>
                    </div>
                )}
            </div>
        </div>
    );
}
