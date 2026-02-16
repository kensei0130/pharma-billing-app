import { auth } from "@/auth";
import { getPeriodicSettings } from "@/app/actions/settings";
import { redirect } from "next/navigation";
import SystemSettingsForm from "./SystemSettingsForm";

export default async function AdminSettingsPage() {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        redirect("/login");
    }

    const settings = await getPeriodicSettings();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">システム設定</h2>
                    <p className="text-slate-500 mt-1">アプリケーション全体の動作に関する設定を管理します。</p>
                </div>
            </div>

            <SystemSettingsForm initialSettings={settings} />
        </div>
    );
}
