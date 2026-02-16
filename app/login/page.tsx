"use client";

import { useActionState, useEffect, useState } from "react";
import { authenticate } from "@/app/actions/authenticate";
import { getActiveAnnouncements } from "@/app/actions/announcements";

// Define locally
type AnnouncementType = {
    id: number;
    title: string;
    content: string | null;
    priority: number | null;
    displayOrder: number | null;
    isActive: boolean;
    createdAt: string;
};

export default function LoginPage() {
    const [errorMessage, dispatch, isPending] = useActionState(
        authenticate,
        undefined
    );

    const [announcements, setAnnouncements] = useState<AnnouncementType[]>([]);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            const data = await getActiveAnnouncements();
            setAnnouncements(data);
        };
        fetchAnnouncements();
    }, []);

    // Priority styles
    const getPriorityStyle = (priority: number) => {
        switch (priority) {
            case 2: return "bg-rose-100 text-rose-700 border-rose-200"; // High
            case 1: return "bg-amber-100 text-amber-700 border-amber-200"; // Medium
            default: return "bg-sky-100 text-sky-700 border-sky-200"; // Low
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white">

            {/* Left Column: Login Form (Fixed width on desktop) */}
            <div className="w-full lg:w-[480px] flex-shrink-0 flex flex-col justify-center px-6 py-12 lg:px-12 z-10 relative bg-white">
                <div className="w-full max-w-sm mx-auto">
                    {/* Header */}
                    <div className="mb-10">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl text-white mb-6 shadow-lg shadow-indigo-200">
                            💊
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            薬剤請求システム
                        </h1>
                        <p className="mt-2 text-slate-500 text-sm">
                            アカウント情報を入力してログインしてください
                        </p>
                    </div>

                    {/* Form */}
                    <form action={dispatch} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="wardId" className="block text-sm font-semibold text-slate-700">
                                ユーザーID
                            </label>
                            <input
                                id="wardId"
                                name="wardId"
                                type="text"
                                placeholder="病棟ID または 管理者ID"
                                required
                                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                                パスワード
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <div
                            className="flex items-center text-sm text-red-600 font-medium min-h-[20px]"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {errorMessage && (
                                <div className="flex items-center bg-red-50 text-red-600 px-3 py-2 rounded-lg w-full">
                                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {errorMessage}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            aria-disabled={isPending}
                            className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-indigo-200 transform active:scale-[0.99]"
                        >
                            {isPending ? "認証中..." : "ログイン"}
                        </button>
                    </form>

                    <div className="mt-12 text-center text-xs text-slate-400 font-medium">
                        &copy; 2026 Hospital Pharmacy System
                    </div>
                </div>
            </div>

            {/* Right Column: Announcements (Flex grow) */}
            <div className="flex-1 bg-slate-50 relative overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-200">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>

                <div className="relative h-full flex flex-col p-6 lg:p-12">
                    <div className="w-full max-w-2xl mx-auto h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600 border border-orange-200 shadow-sm">
                                    📢
                                </span>
                                <h2 className="text-xl font-bold text-slate-800">事務連絡・お知らせ</h2>
                            </div>
                            <span className="text-xs font-semibold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                Latest Updates
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-6">
                            {announcements.length > 0 ? (
                                announcements.map((announcement) => (
                                    <div
                                        key={announcement.id}
                                        className="group bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wide ${getPriorityStyle(announcement.priority ?? 0)}`}>
                                                    {(announcement.priority ?? 0) === 2 ? '重要' : (announcement.priority ?? 0) === 1 ? '注目' : 'INFO'}
                                                </span>
                                                <span className="text-xs font-medium text-slate-400 flex items-center">
                                                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {new Date(announcement.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                                            {announcement.title}
                                        </h3>
                                        {announcement.content && (
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                                {announcement.content}
                                            </p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="h-48 flex flex-col items-center justify-center bg-white/50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <span className="text-4xl mb-2 grayscale opacity-50">📭</span>
                                    <p className="text-sm font-medium text-slate-400">現在お知らせはありません</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
