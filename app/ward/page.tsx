import { auth, signOut } from "@/auth";
import Link from "next/link";
import { getDrugs, getWardConstantDrugs, getWardOrders, getConstantSets } from "@/db/queries";
import { getActiveAnnouncements } from "@/app/actions/announcements";
import { getPeriodicSettings } from "@/app/actions/settings";
import WardDashboardClient from "./WardDashboardClient";
import AnnouncementTicker from "./components/AnnouncementTicker";

export default async function WardDashboard() {
    const session = await auth();
    const drugs = await getDrugs();
    const constantDrugs = session?.user?.id ? await getWardConstantDrugs(session.user.id) : [];
    const sets = session?.user?.id ? await getConstantSets(session.user.id) : [];
    const orderHistory = session?.user?.id ? await getWardOrders(session.user.id) : [];
    const announcements = await getActiveAnnouncements();
    const periodicSettings = await getPeriodicSettings();

    return (
        <div className="min-h-screen bg-slate-100/50">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm bg-white/90">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                            </div>
                            <h1 className="text-lg font-bold text-slate-800 tracking-tight">薬剤請求システム <span className="text-slate-400 font-normal text-sm ml-1">for Ward</span></h1>
                            <div className="hidden md:block">
                                <AnnouncementTicker announcements={announcements} />
                            </div>
                        </div>

                        <div className="flex items-center space-x-6">
                            {session?.user?.role === "admin" && (
                                <Link
                                    href="/admin"
                                    className="hidden md:inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                                >
                                    管理画面へ
                                </Link>
                            )}
                            <div className="hidden md:flex flex-col items-end mr-2">
                                <span className="text-sm font-bold text-slate-700">{session?.user?.name}</span>
                                <span className="text-xs text-slate-500 font-mono">ID: {session?.user?.id}</span>
                            </div>
                            <form
                                action={async () => {
                                    "use server";
                                    await signOut();
                                }}
                            >
                                <button className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg" title="ログアウト">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 px-4">
                {/* Mobile Announcement Ticker (visible only on small screens) */}
                <div className="md:hidden mb-4">
                    <AnnouncementTicker announcements={announcements} />
                </div>


                <WardDashboardClient
                    wardId={session?.user?.id || ""}
                    drugs={drugs}
                    constantDrugs={constantDrugs}
                    sets={sets}
                    orderHistory={orderHistory}
                    periodicSettings={periodicSettings}
                />
            </main>
        </div>
    );
}
