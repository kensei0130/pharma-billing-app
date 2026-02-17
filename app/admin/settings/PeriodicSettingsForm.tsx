"use client";

import { useState } from "react";
import { updatePeriodicSettings } from "@/app/actions/settings";
import { useRouter } from "next/navigation";

export default function PeriodicSettingsForm({
    initialSettings
}: {
    initialSettings: { payoutDayOfWeek: number; deadlineDaysBefore: number }
}) {
    const router = useRouter();
    const [payoutDay, setPayoutDay] = useState(initialSettings.payoutDayOfWeek);
    const [deadlineDays, setDeadlineDays] = useState(initialSettings.deadlineDaysBefore);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");

    const dayOptions = [
        { value: 0, label: "日曜日" },
        { value: 1, label: "月曜日" },
        { value: 2, label: "火曜日" },
        { value: 3, label: "水曜日" },
        { value: 4, label: "木曜日" },
        { value: 5, label: "金曜日" },
        { value: 6, label: "土曜日" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage("");

        const result = await updatePeriodicSettings(payoutDay, deadlineDays);

        setIsSaving(false);
        if (result.success) {
            setMessage("✅ 設定を保存しました");
            router.refresh();
        } else {
            setMessage("❌ " + result.message);
        }
    };

    // Example Calculation for Preview
    const examplePayoutDay = payoutDay;
    const exampleDeadlineDay = (payoutDay - deadlineDays + 7) % 7;

    return (
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6 max-w-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">定期請求のルール設定</h3>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Payout Day Setting */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        ① 払出曜日（請求日）
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                        週に一度、定期的に薬品を払い出す曜日を設定します。
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {dayOptions.map((day) => (
                            <button
                                key={day.value}
                                type="button"
                                onClick={() => setPayoutDay(day.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${payoutDay === day.value
                                    ? "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200"
                                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                                    }`}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Deadline Setting */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        ② 締め切り設定
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                        払出日の何日前に請求を締め切るかを設定します。
                    </p>
                    <div className="flex items-center gap-4">
                        <select
                            value={deadlineDays}
                            onChange={(e) => setDeadlineDays(parseInt(e.target.value))}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 w-32 font-bold"
                        >
                            {[1, 2, 3, 4, 5, 6].map(days => (
                                <option key={days} value={days}>{days} 日前</option>
                            ))}
                        </select>
                        <span className="text-sm font-bold text-slate-700">まで</span>
                    </div>
                </div>

                {/* Preview */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-indigo-800 mb-2 uppercase">設定プレビュー</h4>
                    <div className="flex items-center text-sm">
                        <span className="font-bold text-slate-700">
                            毎週 {dayOptions.find(d => d.value === examplePayoutDay)?.label}
                        </span>
                        <span className="mx-2 text-slate-400">に払い出し</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="font-bold text-red-600">
                            {dayOptions.find(d => d.value === exampleDeadlineDay)?.label} の中
                        </span>
                        <span className="ml-1 text-slate-600">に締め切り</span>
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
