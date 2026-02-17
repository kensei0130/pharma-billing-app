import { auth } from "@/auth";
import { getPeriodicSettings, getMonitorSettings } from "@/app/actions/settings";
import { redirect } from "next/navigation";
import SettingsTabs from "./SettingsTabs";

export default async function AdminSettingsPage() {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        redirect("/login");
    }

    const periodicSettings = await getPeriodicSettings();
    const monitorSettings = await getMonitorSettings();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">システム設定</h2>
                    <p className="text-sm text-slate-500">システムの全体的な挙動を設定します。</p>
                </div>
            </div>

            <SettingsTabs
                periodicSettings={periodicSettings}
                monitorSettings={monitorSettings}
            />
        </div>
    );
}
