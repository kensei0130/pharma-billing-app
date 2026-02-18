"use client";

import { useState } from "react";
import { createOrder } from "@/app/actions/orders";

type ConstantDrug = {
    id: number;
    drugId: number;
    name: string;
    quantity: number;
    unit: string;
    setId: number;
    setName: string;
};

export default function ConstantRequestForm({ constantDrugs }: { constantDrugs: ConstantDrug[] }) {
    // Group by Set
    const sets = Array.from(new Set(constantDrugs.map(d => JSON.stringify({ id: d.setId, name: d.setName }))))
        .map(s => JSON.parse(s))
        .sort((a, b) => a.id - b.id);

    const [selectedSetId, setSelectedSetId] = useState<number>(sets.length > 0 ? sets[0].id : 0);
    const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderType, setOrderType] = useState<"臨時" | "定時">("定時");
    const [message, setMessage] = useState("");

    const displayedDrugs = constantDrugs.filter(d => d.setId === selectedSetId);
    const currentSet = sets.find(s => s.id === selectedSetId);

    const handleQuantityChange = (drugId: number, val: string) => {
        const num = parseInt(val);
        if (isNaN(num) || num < 0) {
            setQuantities({ ...quantities, [drugId]: 0 });
        } else {
            setQuantities({ ...quantities, [drugId]: num });
        }
    };

    const totalItems = Object.values(quantities).filter(q => q > 0).length;

    const handleSubmit = async () => {
        // Filter out items with 0 quantity
        const itemsToSubmit = constantDrugs
            .map(drug => ({
                drugId: drug.drugId,
                quantity: quantities[drug.drugId] || 0
            }))
            .filter(item => item.quantity > 0);

        if (itemsToSubmit.length === 0) {
            alert("請求する薬品の数量を入力してください");
            return;
        }

        if (!confirm(`定数セットから ${itemsToSubmit.length} 品目を【${orderType}請求】として作成しますか？`)) return;

        setIsSubmitting(true);
        setMessage("");

        // Pass selected orderType
        const result = await createOrder(itemsToSubmit, orderType);

        setIsSubmitting(false);
        if (result.success) {
            // Reset form
            setQuantities({});
            setMessage("✅ " + result.message);
        } else {
            setMessage("❌ " + result.message);
        }
    };

    if (constantDrugs.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center">
                <div className="text-slate-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900">定数セットが登録されていません</h3>
                <p className="text-slate-500 mt-2">管理者にお問い合わせください。</p>
            </div>
        );
    }

    return (
        <div className="p-6 min-[1200px]:p-8 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3 text-lg">📦</span>
                    セット請求 (一括作成)
                </h2>
            </div>

            {/* 2-Column Layout */}
            <div className="flex flex-col min-[1200px]:flex-row gap-8 items-start">

                {/* LEFT COLUMN: Controls & Selection */}
                <div className="w-full min-[1200px]:w-1/3 space-y-6">
                    {/* Order Type Selection */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <label className="block text-sm font-bold text-slate-700 mb-2">請求種別</label>
                        <div className="flex space-x-4">
                            <label className={`flex-1 flex items-center p-3 border rounded-lg cursor-pointer transition-all ${orderType === "臨時" ? "bg-green-50 border-green-500 ring-1 ring-green-500" : "bg-white border-slate-300 hover:border-slate-400"}`}>
                                <input
                                    type="radio"
                                    name="constantOrderType"
                                    value="臨時"
                                    checked={orderType === "臨時"}
                                    onChange={() => setOrderType("臨時")}
                                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                />
                                <span className="ml-2 text-sm font-medium text-slate-700">臨時請求</span>
                            </label>
                            <label className={`flex-1 flex items-center p-3 border rounded-lg cursor-pointer transition-all ${orderType === "定時" ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500" : "bg-white border-slate-300 hover:border-slate-400"}`}>
                                <input
                                    type="radio"
                                    name="constantOrderType"
                                    value="定時"
                                    checked={orderType === "定時"}
                                    onChange={() => setOrderType("定時")}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm font-medium text-slate-700">定期請求</span>
                            </label>
                        </div>
                    </div>

                    {/* Set Selection (Vertical List) */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">セットを選択</label>
                        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
                            {sets.map(set => (
                                <button
                                    key={set.id}
                                    onClick={() => setSelectedSetId(set.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex justify-between items-center ${selectedSetId === set.id
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                                        }`}
                                >
                                    <span>{set.name}</span>
                                    {selectedSetId === set.id && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L7 12.586l7.293-7.293a1 1 0 011.414 1.414l-8 8z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Set Details & Actions */}
                <div className="w-full min-[1200px]:w-2/3 flex flex-col h-full">
                    {/* Header & Actions */}
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-700 text-lg">{currentSet?.name || "セット選択"}</h3>
                            <span className="text-xs font-medium px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                                {displayedDrugs.length} 品目登録済
                            </span>
                        </div>

                        {message && (
                            <div className={`w-full text-center text-sm font-medium px-4 py-2 rounded-lg ${message.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                {message}
                            </div>
                        )}

                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <span className="text-sm text-slate-600 font-medium ml-2">
                                選択中: <span className="text-blue-700 font-bold text-xl">{totalItems}</span> 品目
                            </span>
                            <button
                                onClick={handleSubmit}
                                disabled={totalItems === 0 || isSubmitting}
                                className={`px-8 py-2.5 text-white font-bold rounded-lg shadow-md active:transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${orderType === "定時"
                                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                                    : "bg-green-600 hover:bg-green-700 shadow-green-200"
                                    }`}
                            >
                                {isSubmitting ? "送信中..." : `${orderType}請求を送信`}
                            </button>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-6 max-h-[500px] overflow-y-auto">
                        <table className="min-w-full divide-y divide-slate-200 relative">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">薬品名</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">定数</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-32">請求数</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {displayedDrugs.map((drug) => (
                                    <tr key={drug.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{drug.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                {drug.quantity} <span className="ml-1 text-slate-400">{drug.unit}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className={`w-24 text-right p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold ${(quantities[drug.drugId] || 0) > 0
                                                        ? "border-green-500 bg-green-50 text-green-900"
                                                        : "border-slate-200 text-slate-400 bg-slate-50"
                                                        }`}
                                                    placeholder="0"
                                                    value={quantities[drug.drugId] || ""}
                                                    onChange={(e) => handleQuantityChange(drug.drugId, e.target.value)}
                                                />
                                                <span className="ml-2 text-sm text-slate-500 w-8 text-left">{drug.unit}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>


                </div>
            </div>
        </div>
    );
}
