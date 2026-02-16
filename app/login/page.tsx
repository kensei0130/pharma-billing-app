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
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">

            {/* Login Card */}
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-slate-100 mb-8">
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
            </div>

            {/* Announcements Section */}
            <div className="w-full max-w-md">
                <div className="flex items-center mb-4">
                    <span className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 mr-2 text-base">📢</span>
                    <h2 className="text-lg font-bold text-slate-800">お知らせ</h2>
                </div>

                <div className="space-y-4">
                    {announcements.length > 0 ? (
                        announcements.map((announcement) => (
                            <div key={announcement.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPriorityStyle(announcement.priority ?? 0)}`}>
                                        {(announcement.priority ?? 0) === 2 ? '重要' : (announcement.priority ?? 0) === 1 ? '注目' : 'Info'}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {new Date(announcement.createdAt).toLocaleDateString()}
                                    </span>
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
                        <div className="text-center py-8 bg-white/50 rounded-xl border border-dashed border-slate-300 text-slate-400 text-sm">
                            お知らせはありません
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-slate-400">
                &copy; 2026 Hospital Pharmacy System
            </div>
        </div>
    );
}
