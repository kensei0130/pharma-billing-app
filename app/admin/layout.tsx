import { auth, signOut } from "@/auth";
import Link from "next/link";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <div className="min-h-screen bg-slate-100/50">
            <nav className="bg-slate-900 border-b border-indigo-500/30 sticky top-0 z-10 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <div className="flex items-center space-x-3">
                                <div className="bg-indigo-500 text-white p-1.5 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                    </svg>
                                </div>
                                <h1 className="text-lg font-bold tracking-tight">管理コンソール</h1>
                            </div>

                            <div className="hidden md:flex space-x-4">
                                <Link href="/admin" className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-slate-800 transition-colors">
                                    承認待ち
                                </Link>
                                <Link href="/admin/drugs" className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                                    薬品マスタ
                                </Link>
                                <Link href="/admin/wards" className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                                    病棟マスタ
                                </Link>
                                <Link href="/admin/history" className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                                    請求履歴
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center ml-6 border-l border-slate-700 pl-6">
                            <Link
                                href="/ward"
                                className="flex items-center text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                                通常画面へ戻る
                            </Link>
                        </div>


                        <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-sm font-bold text-slate-200">{session?.user?.name}</span>
                                <span className="text-xs text-slate-500">Administrator</span>
                            </div>
                            <form
                                action={async () => {
                                    "use server";
                                    await signOut();
                                }}
                            >
                                <button className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav >

            <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                {children}
            </main>
        </div >
    );
}
