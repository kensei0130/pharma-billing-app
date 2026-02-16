import { auth } from "@/auth";
import { getAnnouncements } from "@/app/actions/announcements";
import { redirect } from "next/navigation";
import AnnouncementManager from "./AnnouncementManager";

export default async function AdminAnnouncementsPage() {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        redirect("/login");
    }

    const announcements = await getAnnouncements();

    return (
        <div className="h-full space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">お知らせ管理</h2>
                    <p className="text-slate-500 mt-1">病棟向けの周知事項の登録・編集・並び替えを行います。</p>
                </div>
            </div>

            <AnnouncementManager initialAnnouncements={announcements} />
        </div>
    );
}
