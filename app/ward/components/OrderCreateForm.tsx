"use client";

import { useState, useEffect } from "react";
import { createOrder, updateOrder } from "@/app/actions/orders";
import { getNextPayoutDates, getNextPayoutDate, formatDate, isDeadlinePassed, getDeadline, toLocalISOString, getPreviousPayoutDate } from "@/lib/date-utils";

type Drug = {
    id: number;
    name: string;
    unit: string;
    category: string | null;
    furigana: string | null;
    allowComment: boolean;
};

type EditingOrder = {
    id: number;
    type: "臨時" | "定時" | "返却";
    items: { drugId: number; quantity: number }[];
};

export default function OrderCreateForm({ drugs, initialOrder, onCancelEdit, periodicSettings }: {
    drugs: Drug[],
    initialOrder?: EditingOrder | null,
    onCancelEdit?: () => void,
    periodicSettings: { payoutDayOfWeek: number; deadlineDaysBefore: number }
}) {
    const [cart, setCart] = useState<{ drugId: number; name: string; quantity: number; unit: string; comment: string; allowComment: boolean }[]>([]);

    // Selection State
    const [drugSearchQuery, setDrugSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [orderType, setOrderType] = useState<"臨時" | "定時" | "返却">("臨時");

    const [orderComment, setOrderComment] = useState("");

    // Automatic Cycle Calculation
    const [targetDateInfo, setTargetDateInfo] = useState<{ payout: Date, deadline: Date } | null>(null);
    const [isException, setIsException] = useState(false);

    useEffect(() => {
        if (orderType === "定時") {
            const now = new Date();
            // If exception, we want the previous payout date.
            // But we might need to rely on the checkbox state to calculate the displayed date?
            // Actually, the UI logic showed "Automatically assigned".
            // If I check "Exception", the displayed date should change to the previous one?
            // YES.

            // Let's calculate both potential dates or just based on isException.
            let payout: Date;
            if (isException) {
                payout = getPreviousPayoutDate(now, periodicSettings.payoutDayOfWeek, periodicSettings.deadlineDaysBefore);
            } else {
                payout = getNextPayoutDate(now, periodicSettings.payoutDayOfWeek, periodicSettings.deadlineDaysBefore);
            }

            const deadline = getDeadline(payout, periodicSettings.deadlineDaysBefore);
            setTargetDateInfo({ payout, deadline });
        } else {
            setTargetDateInfo(null);
            setIsException(false);
        }
    }, [orderType, periodicSettings, isException]);

    const isDeadlineWarn = targetDateInfo ? isDeadlinePassed(targetDateInfo.payout, periodicSettings.deadlineDaysBefore) : false;


    // remove old useEffect dependent on scheduledDate



    // Initialize from props
    useEffect(() => {
        if (initialOrder) {
            setOrderType(initialOrder.type);
            const initialCart = initialOrder.items.map(item => {
                const drug = drugs.find(d => d.id === item.drugId);
                return {
                    drugId: item.drugId,
                    name: drug?.name || "Unknown",
                    quantity: item.quantity,
                    unit: drug?.unit || "",
                    comment: "", // Initial edit might lack comment if not fetched, but we don't have it in EditingOrder yet. Logic warning.
                    allowComment: drug?.allowComment || false
                };
            });
            setCart(initialCart);
            setMessage("📝 編集モード: 内容を修正して更新してください");
        } else {
            // Reset if no initial order (switched back to create mode)
            setCart([]);
            setOrderType("臨時");
            setOrderComment("");
            setMessage("");
        }
    }, [initialOrder, drugs]);

    const handleAdd = (drug: Drug) => {
        if (cart.find((item) => item.drugId === drug.id)) {
            // alert("この薬品は既に追加されています"); // UI shows "Added" or disabled, so alert might be redundant but safely kept if they force correct
            return;
        }

        setCart([...cart, { drugId: drug.id, name: drug.name, quantity: 1, unit: drug.unit, comment: "", allowComment: drug.allowComment }]);
        setDrugSearchQuery(""); // Clear search to allow next search
        setMessage("");
    };

    // Derived Data for UI
    const categories = Array.from(new Set(drugs.map(d => d.category).filter(Boolean))) as string[];

    const filteredDrugs = drugSearchQuery
        ? drugs.filter(d =>
            d.name.includes(drugSearchQuery) ||
            (d.furigana && d.furigana.includes(drugSearchQuery))
        ).slice(0, 10)
        : [];

    const categoryDrugs = selectedCategory
        ? drugs.filter(d => d.category === selectedCategory)
        : [];

    const handleRemove = (drugId: number) => {
        setCart(cart.filter((item) => item.drugId !== drugId));
    };

    const handleSubmit = async () => {
        if (cart.length === 0) return;

        let confirmMsg = `${orderType}請求を${initialOrder ? "更新" : "作成"}しますか？`;
        if (orderType === "定時" && isDeadlineWarn) {
            confirmMsg = "⚠️ 締め切りを過ぎていますが、この払出日で請求しますか？\n（管理者の承認が必要です）";
        }

        if (!confirm(confirmMsg)) return;

        setIsSubmitting(true);
        setMessage("");

        let result;
        const items = cart.map((item) => ({ drugId: item.drugId, quantity: item.quantity, comment: item.comment }));

        if (initialOrder) {
            result = await updateOrder(initialOrder.id, items, orderType);
        } else {
            // createOrder updated signature: (items, type, scheduledDate?, periodicEventId?, isException?, reason?)
            // We do NOT pass periodicEventId anymore, logic is handled on server.
            // Passing scheduledDate as string for logging/display if needed, but server overrides.
            // Let's passed undefined for ID.
            const scheduledDateStr = (orderType === "定時" && targetDateInfo) ? toLocalISOString(targetDateInfo.payout) : undefined;

            result = await createOrder(items, orderType, scheduledDateStr, undefined, isException, orderComment);
        }

        setIsSubmitting(false);
        if (result.success) {
            if (!initialOrder) {
                setCart([]); // Clear cart only if creating new
                setOrderComment("");
            }
            setMessage("✅ " + result.message);
            if (initialOrder && onCancelEdit) {
                setTimeout(() => {
                    onCancelEdit(); // Exit edit mode after success
                }, 1500);
            }
        } else {
            setMessage("❌ " + result.message);
        }
    };

    return (
        <div className={`rich-card p-6 min-[1200px]:p-8 ${initialOrder ? "border-2 border-indigo-200 shadow-indigo-100" : ""}`}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <span className={`p-2 rounded-lg mr-3 text-lg ${initialOrder ? "bg-orange-100 text-orange-600" : "bg-indigo-100 text-indigo-600"}`}>
                        {initialOrder ? "✏️" : "📝"}
                    </span>
                    {initialOrder ? "請求の編集" : "請求作成"}
                </h2>
                <div className="flex items-center space-x-2">
                    {initialOrder && onCancelEdit && (
                        <button
                            onClick={onCancelEdit}
                            className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full hover:bg-slate-200"
                        >
                            キャンセル
                        </button>
                    )}
                    {cart.length > 0 && (
                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                            {cart.length} 品目選択中
                        </span>
                    )}
                </div>
            </div>

            {/* 2-Column Layout */}
            <div className="flex flex-col min-[1200px]:flex-row gap-8 items-start">

                {/* LEFT COLUMN: Controls & Selection */}
                <div className="w-full min-[1200px]:w-1/2 space-y-6">

                    {/* Order Type Selection */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <label className="block text-sm font-bold text-slate-700 mb-2">請求種別</label>
                        <div className="flex space-x-4 mb-3">
                            <label className={`flex-1 flex items-center p-3 border rounded-lg cursor-pointer transition-all ${orderType === "臨時" ? "bg-green-50 border-green-500 ring-1 ring-green-500" : "bg-white border-slate-300 hover:border-slate-400"}`}>
                                <input
                                    type="radio"
                                    name="orderType"
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
                                    name="orderType"
                                    value="定時"
                                    checked={orderType === "定時"}
                                    onChange={() => setOrderType("定時")}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm font-medium text-slate-700">定期請求</span>
                            </label>
                            <label className={`flex-1 flex items-center p-3 border rounded-lg cursor-pointer transition-all ${orderType === "返却" ? "bg-red-50 border-red-500 ring-1 ring-red-500" : "bg-white border-slate-300 hover:border-slate-400"}`}>
                                <input
                                    type="radio"
                                    name="orderType"
                                    value="返却"
                                    checked={orderType === "返却"}
                                    onChange={() => setOrderType("返却")}
                                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                                />
                                <span className="ml-2 text-sm font-medium text-slate-700">返却請求</span>
                            </label>
                        </div>

                        {/* Automatic Payout Date Display */}
                        {orderType === "定時" && targetDateInfo && (
                            <div className={`mt-4 p-4 border rounded-lg animate-in fade-in transition-colors ${isDeadlineWarn && !isException
                                ? "bg-red-50 border-red-200"
                                : "bg-indigo-50 border-indigo-200"
                                }`}>
                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDeadlineWarn && !isException ? "text-red-800" : "text-indigo-800"
                                    }`}>
                                    請求対象の払出日 (自動判定)
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className="bg-white px-3 py-2 rounded border border-indigo-100 shadow-sm">
                                        <span className={`text-xl font-bold ${isDeadlineWarn && !isException ? "text-red-700" : "text-indigo-700"
                                            }`}>
                                            {formatDate(targetDateInfo.payout)}
                                        </span>
                                    </div>
                                    <div className={`text-xs ${isDeadlineWarn && !isException ? "text-red-600 font-bold" : "text-indigo-600"
                                        }`}>
                                        <p>締切: {targetDateInfo.deadline.getMonth() + 1}/{targetDateInfo.deadline.getDate()} {targetDateInfo.deadline.getHours()}:59</p>
                                    </div>
                                </div>

                                <div className="mt-3 bg-white p-3 rounded border border-slate-100">
                                    {isDeadlineWarn && !isException && (
                                        <p className="text-xs text-red-600 font-bold flex items-center mb-2">
                                            ⚠️ 直近の締め切りを過ぎています
                                        </p>
                                    )}
                                    <label className="flex items-start cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                                        <input
                                            type="checkbox"
                                            className="mt-1 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                                            checked={isException}
                                            onChange={(e) => setIsException(e.target.checked)}
                                        />
                                        <div className="ml-2">
                                            <span className="text-xs text-slate-700 font-bold block">
                                                前回のクール分として請求する（例外対応）
                                            </span>
                                            <span className="text-slate-500 text-[10px] block mt-0.5">
                                                {isException
                                                    ? "※現在「前回のクール」が選択されています。"
                                                    : "※チェックを入れると、一つ前のクール（過去分）として請求します。"
                                                }
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                <p className="text-[10px] text-indigo-500 mt-2">
                                    ※自動的に{isException ? "前回の" : "次回の"}定期配送枠に割り振られます。手続きは不要です。
                                </p>
                            </div>
                        )}

                        <p className="text-xs text-slate-500 mt-2 ml-1">
                            {orderType === "臨時" ? "※緊急で必要な薬品を個別に請求します。" : "※週に一度の定期配送に合わせて請求します。"}
                        </p>
                    </div>

                    <hr className="border-slate-200" />

                    {/* Drug Selection (Stacked Vertical) */}
                    <div className="space-y-6">
                        {/* Search Section */}
                        <div className="w-full relative">
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
                                                const isAdded = cart.some(i => i.drugId === drug.id);
                                                return (
                                                    <button
                                                        key={drug.id}
                                                        onClick={() => handleAdd(drug)}
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

                        {/* Category Section */}
                        <div className="w-full">
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
                                            handleAdd(d);
                                        }
                                    }}
                                >
                                    <option value="">{selectedCategory ? (categoryDrugs.length > 0 ? "▼ 薬品を選択して追加" : "該当する薬品がありません") : "カテゴリ未選択"}</option>
                                    {categoryDrugs.map(d => {
                                        const isAdded = cart.some(i => i.drugId === d.id);
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

                {/* RIGHT COLUMN: Cart & Actions */}
                <div className="w-full min-[1200px]:w-1/2 flex flex-col h-full">

                    {/* Actions (Moved to Top) */}
                    <div className="mb-6 flex flex-col items-end">
                        <div className="w-full flex justify-between items-center mb-2">
                            <div className="flex items-center gap-4">
                                <label className="block text-sm font-bold text-slate-700">🛒 請求カート</label>
                                {cart.length > 0 && (
                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">Total: {cart.length}</span>
                                )}
                            </div>

                            {message && (
                                <div className={`text-xs font-bold px-2 py-1 rounded flex items-center animate-in fade-in slide-in-from-bottom-2 ${message.startsWith("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                    {message}
                                </div>
                            )}
                        </div>

                        {/* Order Remarks & Checksum */}
                        {/* Remarks Input */}
                        <div className="w-full mb-2 flex items-start gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1">備考 (任意) <span className="font-normal text-slate-400">※請求者など</span></label>
                                <textarea
                                    value={orderComment}
                                    onChange={(e) => setOrderComment(e.target.value)}
                                    placeholder="請求に関する備考があれば入力してください"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-[52px] resize-none placeholder-slate-400"
                                />
                            </div>

                            <div className="flex-1 pt-6"> {/* Align with textarea based on label height */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={cart.length === 0 || isSubmitting}
                                    className={`w-full py-3 text-base font-bold flex items-center justify-center rounded-xl shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0 ${initialOrder
                                        ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/30 text-white"
                                        : orderType === "臨時"
                                            ? "bg-green-600 hover:bg-green-700 shadow-green-500/30 text-white"
                                            : orderType === "返却"
                                                ? "bg-red-600 hover:bg-red-700 shadow-red-500/30 text-white"
                                                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 text-white"
                                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                            送信中...
                                        </>
                                    ) : (
                                        <>
                                            {initialOrder ? "更新を保存" : `請求を確定 (${orderType})`}
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        {cart.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 flex flex-col items-center justify-center h-[300px]">
                                <svg className="w-12 h-12 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <p className="font-bold">薬品を追加してください</p>
                                <p className="text-xs mt-2">検索またはカテゴリから選択できます</p>
                            </div>
                        ) : (
                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white max-h-[500px] overflow-y-auto">
                                <ul className="divide-y divide-slate-100">
                                    {cart.map((item) => (
                                        <li key={item.drugId} className="flex justify-between items-center p-4 bg-white hover:bg-slate-50 transition-colors group">
                                            <div className="flex-1">
                                                <span className="font-bold text-slate-800 block mb-1">{item.name}</span>
                                                <div className="flex items-center">
                                                    <span className="text-xs text-slate-500 mr-2 bg-slate-100 px-1.5 py-0.5 rounded">数量</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const newQuantity = parseInt(e.target.value) || 1;
                                                            setCart(cart.map(c => c.drugId === item.drugId ? { ...c, quantity: newQuantity } : c));
                                                        }}
                                                        className="w-16 text-right px-2 py-1 border rounded text-sm font-bold border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none mr-2"
                                                    />
                                                    <span className="text-sm text-slate-500 font-mono">{item.unit}</span>
                                                </div>
                                                {item.allowComment && (
                                                    <div className="mt-2 text-xs">
                                                        <input
                                                            type="text"
                                                            placeholder=""
                                                            value={item.comment || ""}
                                                            onChange={(e) => {
                                                                setCart(cart.map(c => c.drugId === item.drugId ? { ...c, comment: e.target.value } : c));
                                                            }}
                                                            className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none bg-yellow-50 focus:bg-white transition-colors placeholder-slate-400"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleRemove(item.drugId)}
                                                className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Action Area (Sticky Bottom on mobile, static on desktop) */}
                    {/* Moved to top */}
                </div>
            </div>
        </div >
    );
}
