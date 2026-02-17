"use client";

import { useState } from "react";
import PeriodicSettingsForm from "./PeriodicSettingsForm";
import MonitorSettingsForm from "./MonitorSettingsForm";

export default function SettingsTabs({
    periodicSettings,
    monitorSettings
}: {
    periodicSettings: { payoutDayOfWeek: number; deadlineDaysBefore: number };
    monitorSettings: { targetType: string; dateRange: number };
}) {
    const [activeTab, setActiveTab] = useState<"periodic" | "monitor">("periodic");

    return (
        <div className="space-y-6">
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl max-w-md">
                <button
                    onClick={() => setActiveTab("periodic")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === "periodic"
                        ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        }`}
                >
                    定期請求設定
                </button>
                <button
                    onClick={() => setActiveTab("monitor")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === "monitor"
                        ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        }`}
                >
                    モニター設定
                </button>
            </div>

            <div className="animate-in fade-in duration-300">
                {activeTab === "periodic" ? (
                    <PeriodicSettingsForm initialSettings={periodicSettings} />
                ) : (
                    <MonitorSettingsForm initialSettings={monitorSettings} />
                )}
            </div>
        </div>
    );
}
