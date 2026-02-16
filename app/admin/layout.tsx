import { auth, signOut } from "@/auth";
import Link from "next/link";
import AdminNavigation from "./components/AdminNavigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <div className="min-h-screen bg-slate-100 font-sans">
            <nav className="bg-slate-900 border-b border-indigo-500/10 sticky top-0 z-50 text-white shadow-lg shadow-slate-900/5">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-8">
                            {/* Logo Area */}
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-500/30">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-sm font-extrabold tracking-tight text-white leading-none">PHARMA</h1>
                                    <span className="text-[10px] text-indigo-300 font-bold tracking-widest uppercase">Console</span>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="hidden md:block">
                                <AdminNavigation />
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-6">

                            {/* Return Link */}
                            <Link
                                href="/ward"
                                className="group flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20"
                            >
                                <span className="bg-emerald-500 rounded-full w-1.5 h-1.5 group-hover:animate-pulse"></span>
                                現場画面へ
                                <svg className="w-3 h-3 opacity-50 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            </Link>

                            <div className="h-6 w-px bg-slate-700"></div>

                            {/* User Profile */}
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-bold text-slate-200">{session?.user?.name}</span>
                                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-900">ADMIN</span>
                                </div>
                                <form
                                    action={async () => {
                                        "use server";
                                        await signOut();
                                    }}
                                >
                                    <button className="text-slate-400 hover:text-white hover:bg-white/10 transition-all p-2 rounded-lg group" title="ログアウト">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-[1600px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
