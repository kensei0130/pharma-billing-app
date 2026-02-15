"use client";

import { useState, useEffect } from "react";


// Define the type locally if not available globally yet, or assume it matches schema
type AnnouncementType = {
    id: number;
    title: string;
    content: string | null;
    priority: number | null;
    isActive: boolean;
    createdAt: string;
};

export default function AnnouncementTicker({ announcements }: { announcements: AnnouncementType[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filter active announcements just in case, though server should pass only active ones
    // and sort by priority/date (already done by server)
    const items = announcements;

    if (items.length === 0) return null;

    const next = () => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    const prev = () => {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    // Auto-rotate every 5 seconds if there's more than one
    useEffect(() => {
        if (items.length <= 1) return;
        const interval = setInterval(next, 5000);
        return () => clearInterval(interval);
    }, [items.length]);

    const currentItem = items[currentIndex];

    // Priority styles
    const getPriorityStyle = (priority: number) => {
        switch (priority) {
            case 2: return "bg-red-100 text-red-800 border-red-200"; // High
            case 1: return "bg-yellow-100 text-yellow-800 border-yellow-200"; // Medium
            default: return "bg-blue-100 text-blue-800 border-blue-200"; // Low
        }
    };

    return (
        <div className="flex items-center bg-white rounded-md border border-slate-200 px-3 py-1 ml-4 shadow-sm max-w-xl flex-1">
            <span className="flex-shrink-0 text-xs font-bold text-slate-500 mr-2 border-r border-slate-200 pr-2">
                お知らせ
            </span>

            <div className="flex-1 flex items-center overflow-hidden min-w-0">
                <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded border mr-2 ${getPriorityStyle(currentItem.priority ?? 0)}`}>
                    {(currentItem.priority ?? 0) === 2 ? '重要' : (currentItem.priority ?? 0) === 1 ? '注目' : 'Info'}
                </span>
                <p className="text-sm text-slate-700 truncate mr-2">
                    <span className="font-medium mr-1">{currentItem.title}</span>
                    <span className="text-slate-500 text-xs">- {currentItem.content}</span>
                </p>
            </div>

            {items.length > 1 && (
                <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 ml-auto">
                    <button
                        onClick={prev}
                        className="text-slate-400 hover:text-slate-600 p-0.5 hover:bg-slate-100 rounded"
                        aria-label="前のお知らせ"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono w-8 text-center select-none">
                        {currentIndex + 1} / {items.length}
                    </span>
                    <button
                        onClick={next}
                        className="text-slate-400 hover:text-slate-600 p-0.5 hover:bg-slate-100 rounded"
                        aria-label="次のお知らせ"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            )}
        </div>
    );
}
