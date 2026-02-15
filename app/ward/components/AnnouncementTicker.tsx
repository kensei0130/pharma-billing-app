"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// Define the type locally if not available globally yet, or assume it matches schema
type AnnouncementType = {
    id: number;
    title: string;
    content: string | null;
    priority: number | null;
    displayOrder: number | null;
    isActive: boolean;
    createdAt: string;
};

export default function AnnouncementTicker({ announcements }: { announcements: AnnouncementType[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementType | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
        if (items.length <= 1 || isModalOpen) return; // Pause rotation when modal is open
        const interval = setInterval(next, 5000);
        return () => clearInterval(interval);
    }, [items.length, isModalOpen]);

    const currentItem = items[currentIndex];

    const openModal = (announcement: AnnouncementType) => {
        setSelectedAnnouncement(announcement);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedAnnouncement(null);
    };

    // Priority styles
    const getPriorityStyle = (priority: number) => {
        switch (priority) {
            case 2: return "bg-red-100 text-red-800 border-red-200"; // High
            case 1: return "bg-yellow-100 text-yellow-800 border-yellow-200"; // Medium
            default: return "bg-blue-100 text-blue-800 border-blue-200"; // Low
        }
    };

    return (
        <>
            <div className="flex items-center bg-white rounded-md border border-slate-200 px-3 py-1 ml-4 shadow-sm w-[600px]">
                <span className="flex-shrink-0 text-xs font-bold text-slate-500 mr-2 border-r border-slate-200 pr-2">
                    お知らせ
                </span>

                <div
                    className="flex-1 flex items-center overflow-hidden min-w-0 cursor-pointer hover:bg-slate-50 rounded transition-colors"
                    onClick={() => openModal(currentItem)}
                    title="クリックで詳細を表示"
                >
                    <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded border mr-2 ${getPriorityStyle(currentItem.priority ?? 0)}`}>
                        {(currentItem.priority ?? 0) === 2 ? '重要' : (currentItem.priority ?? 0) === 1 ? '注目' : 'Info'}
                    </span>
                    <p className="text-sm text-slate-700 truncate mr-2 select-none">
                        <span className="font-medium mr-1">{currentItem.title}</span>
                        <span className="text-slate-500 text-xs">- {currentItem.content}</span>
                    </p>
                </div>

                {items.length > 1 && (
                    <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 ml-auto">
                        <button
                            onClick={(e) => { e.stopPropagation(); prev(); }}
                            className="text-slate-400 hover:text-slate-600 p-0.5 hover:bg-slate-100 rounded"
                            aria-label="前のお知らせ"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono w-8 text-center select-none">
                            {currentIndex + 1} / {items.length}
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); next(); }}
                            className="text-slate-400 hover:text-slate-600 p-0.5 hover:bg-slate-100 rounded"
                            aria-label="次のお知らせ"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Portal */}
            {mounted && isModalOpen && selectedAnnouncement && createPortal(
                <div className="relative z-[9999]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={closeModal}></div>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                <div>
                                    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${(selectedAnnouncement.priority ?? 0) === 2 ? 'bg-red-100' : (selectedAnnouncement.priority ?? 0) === 1 ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                                        <svg className={`h-6 w-6 ${(selectedAnnouncement.priority ?? 0) === 2 ? 'text-red-600' : (selectedAnnouncement.priority ?? 0) === 1 ? 'text-yellow-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-5">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                            {selectedAnnouncement.title}
                                        </h3>
                                        <div className="mt-2 text-left">
                                            <p className="text-sm text-gray-500 whitespace-pre-wrap">
                                                {selectedAnnouncement.content}
                                            </p>
                                            <p className="mt-4 text-xs text-gray-400 text-right">
                                                {new Date(selectedAnnouncement.createdAt).toLocaleDateString()} {new Date(selectedAnnouncement.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-6">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                                        onClick={closeModal}
                                    >
                                        閉じる
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
