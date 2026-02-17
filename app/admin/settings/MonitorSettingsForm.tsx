"use client";

import { useState } from "react";
import { updateMonitorSettings } from "@/app/actions/settings";
import { useRouter } from "next/navigation";

export default function MonitorSettingsForm({
    initialSettings
}: {
    initialSettings: { targetType: string; dateRange: number; pendingDateRange: number }
}) {
    const router = useRouter();
    const [targetTypes, setTargetTypes] = useState<string[]>(
        initialSettings.targetType === "all" ? ["all"] : initialSettings.targetType.split(",")
    );
    const [dateRange, setDateRange] = useState(initialSettings.dateRange);
    const [pendingDateRange, setPendingDateRange] = useState(initialSettings.pendingDateRange);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");

    const typeOptions = [
        { value: "all", label: "すべて" },
        { value: "periodic", label: "定期請求" },
        { value: "urgent", label: "返却請求" },
        { value: "temporary", label: "臨時請求" },
    ];

    const rangeOptions = [
        { value: 0, label: "当日のみ" },
        { value: 3, label: "直近3日間" },
        { value: 7, label: "直近1週間" },
        { value: 999, label: "すべて（期間指定なし）" },
    ];

    // Options for Pending might need to be different? For now reuse same logic but maybe add "All" (Infinity).
    const pendingRangeOptions = [
        { value: 0, label: "当日のみ" },
        { value: 3, label: "直近3日間" },
        { value: 7, label: "直近1週間" },
        { value: 30, label: "直近1ヶ月" },
        { value: 999, label: "すべて" },
    ];

    const handleTypeToggle = (value: string) => {
        if (value === "all") {
            setTargetTypes(["all"]);
            return;
        }

        let newTypes = [...targetTypes];
        if (newTypes.includes("all")) {
            newTypes = [];
        }

        if (newTypes.includes(value)) {
            newTypes = newTypes.filter(t => t !== value);
        } else {
            newTypes.push(value);
        }

        if (newTypes.length === 0) {
            newTypes = ["all"]; // Revert to all if empty
        }

        setTargetTypes(newTypes);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage("");

        // Join with comma
        const typeString = targetTypes.join(",");
        const result = await updateMonitorSettings(typeString, dateRange, pendingDateRange);

        setIsSaving(false);
        if (result.success) {
            setMessage("✅ 設定を保存しました");
            router.refresh();
        } else {
            setMessage("❌ " + result.message);
        }
    };

    return (
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6 max-w-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">モニター表示設定</h3>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Target Type Setting */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        ① 表示対象の請求種別
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                        モニターに表示する請求の種類を選択します（複数選択可）。
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {typeOptions.map((type) => {
                            const isSelected = targetTypes.includes(type.value);
                            return (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => handleTypeToggle(type.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${isSelected
                                        ? "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200"
                                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                                        }`}
                                >
                                    {type.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Pending Date Range Setting */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        ② 【確認中】データの表示期間
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                        承認待ち（左側）データの表示期間を設定します。未処理の古いデータを除外したい場合に有効です。
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {pendingRangeOptions.map((range) => (
                            <button
                                key={range.value}
                                type="button"
                                onClick={() => setPendingDateRange(range.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${pendingDateRange === range.value
                                    ? "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200"
                                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Range Setting */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        ③ 【受取可能】データの表示期間
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                        承認済み（右側）データの表示期間を設定します。完了したデータがいつまで表示されるかを制御します。
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {rangeOptions.map((range) => (
                            <button
                                key={range.value}
                                type="button"
                                onClick={() => setDateRange(range.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${dateRange === range.value
                                    ? "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200"
                                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    {message && (
                        <span className={`text-sm font-bold ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
                            {message}
                        </span>
                    )}
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md shadow-indigo-200 transition-all disabled:opacity-70"
                    >
                        {isSaving ? "保存中..." : "設定を保存"}
                    </button>
                </div>
            </form>
        </div>
    );
}
