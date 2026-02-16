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
            case 2: return "bg-red-100 text-red-800 border-red-200"; // High
            case 1: return "bg-yellow-100 text-yellow-800 border-yellow-200"; // Medium
            default: return "bg-blue-100 text-blue-800 border-blue-200"; // Low
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Left Column: Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 relative z-10 w-full lg:w-1/2 lg:max-w-xl mx-auto lg:mx-0 bg-white lg:bg-transparent shadow-none lg:shadow-none">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-slate-100 lg:border-none lg:shadow-none lg:bg-transparent">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-2xl text-white mb-4">
                            💊
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            薬剤請求システム
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            医薬品請求システムにログイン
                        </p>
                    </div>

                    {/* Form */}
                    <form action={dispatch} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="wardId" className="block text-sm font-semibold text-slate-700">
                                ID
                            </label>
                            <div className="relative">
                                <input
                                    id="wardId"
                                    name="wardId"
                                    type="text"
                                    placeholder="病棟ID または 管理者ID"
                                    required
                                    className="w-full px-4 py-3 rounded-lg simple-input text-slate-900 placeholder:text-slate-400 text-sm font-medium outline-none border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                                パスワード
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 rounded-lg simple-input text-slate-900 placeholder:text-slate-400 text-sm font-medium outline-none border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div
                            className="flex items-center space-x-2 text-sm text-red-600 font-medium min-h-[20px]"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {errorMessage && (
                                <span>{errorMessage}</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            aria-disabled={isPending}
                            className="w-full py-3 px-4 rounded-lg text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-200"
                        >
                            {isPending ? "認証中..." : "ログイン"}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-xs text-slate-400">
                        &copy; 2026 Hospital Pharmacy System
                    </div>
                </div>
            </div>

            {/* Right Column: Announcements (Visible on Desktop) */}
            <div className="hidden lg:flex flex-1 bg-slate-100 flex-col justify-center items-center p-12 border-l border-slate-200">
                <div className="w-full max-w-lg">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                        <span className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 mr-3 text-lg">📢</span>
                        お知らせ
                    </h2>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {announcements.length > 0 ? (
                            announcements.map((announcement) => (
                                <div key={announcement.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityStyle(announcement.priority ?? 0)}`}>
                                                {(announcement.priority ?? 0) === 2 ? '重要' : (announcement.priority ?? 0) === 1 ? '注目' : 'Info'}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {new Date(announcement.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-800 mb-1">{announcement.title}</h3>
                                    {announcement.content && (
                                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                            {announcement.content}
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                                お知らせはありません
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Announcement Section (Visible below login on mobile) */}
            <div className="lg:hidden w-full bg-slate-50 border-t border-slate-200 p-6">
                <div className="max-w-md mx-auto">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <span className="bg-white p-1 rounded-md shadow-sm border border-slate-200 mr-2 text-sm">📢</span>
                        お知らせ
                    </h2>
                    <div className="space-y-4">
                        {announcements.slice(0, 3).map((announcement) => (
                            <div key={announcement.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getPriorityStyle(announcement.priority ?? 0)}`}>
                                        {(announcement.priority ?? 0) === 2 ? '重要' : (announcement.priority ?? 0) === 1 ? '注目' : 'Info'}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                        {new Date(announcement.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{announcement.title}</h3>
                                {announcement.content && (
                                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                                        {announcement.content}
                                    </p>
                                )}
                            </div>
                        ))}
                        {announcements.length > 3 && (
                            <div className="text-center text-xs text-slate-400 pt-2">
                                他 {announcements.length - 3} 件のお知らせ
                            </div>
                        )}
                        {announcements.length === 0 && (
                            <div className="text-center py-6 text-sm text-slate-400">
                                お知らせはありません
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
