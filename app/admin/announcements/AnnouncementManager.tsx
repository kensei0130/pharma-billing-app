"use client";

import { useState } from "react";
import { createAnnouncement, updateAnnouncement, updateAnnouncementOrder, deleteAnnouncement, toggleAnnouncementStatus } from "@/app/actions/announcements";

type Announcement = {
    id: number;
    title: string;
    content: string | null;
    priority: number | null; // 0: Low, 1: Medium, 2: High
    displayOrder: number | null;
    isActive: boolean;
    createdAt: string;
};

export default function AnnouncementManager({ initialAnnouncements }: { initialAnnouncements: Announcement[] }) {
    const [announcements, setAnnouncements] = useState(initialAnnouncements);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // For Form State
    // If selectedId is null -> New Creation Mode
    // If selectedId is number -> Edit Mode
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        priority: 0,
    });

    const filteredAnnouncements = announcements.filter(a =>
        a.title.includes(searchTerm) || (a.content && a.content.includes(searchTerm))
    );

    const handleSelect = (announcement: Announcement) => {
        setSelectedId(announcement.id);
        setFormData({
            title: announcement.title,
            content: announcement.content || "",
            priority: announcement.priority ?? 0,
        });
    };

    const handleCreateNew = () => {
        setSelectedId(null);
        setFormData({ title: "", content: "", priority: 0 });
    };

    const handleSubmit = async () => {
        if (!formData.title) return;

        if (selectedId) {
            // Update
            await updateAnnouncement(selectedId, formData);
            setAnnouncements(prev => prev.map(a => a.id === selectedId ? { ...a, ...formData, content: formData.content || null } : a));
        } else {
            // Create
            // We can't easily get the new ID back from valid void server action without changing it to return data.
            // For now, let's just trigger a router refresh or rely on revalidation if we passed a callback?
            // Actually, server actions running in Client Component don't automatically update local state unless we fetch or return.
            // But `createAnnouncement` calls revalidatePath. 
            // Better approach: assume page reload or we need `createAnnouncement` to return the new object.
            // Let's modify the action later if needed, but for now we can just call it.
            // To see the new item immediately without reload, we might need a refresh.
            // Let's use `router.refresh()` pattern if I had router.

            // Wait, I can't easily optimistic update creation without ID.
            // I'll rely on `createAnnouncement` revalidating the page, which updates `initialAnnouncements` prop?
            // No, props don't update automatically on mutation unless parent re-renders.
            // Standard Next.js pattern: router.refresh() after mutation.

            await createAnnouncement(formData);
            // We rely on parent refresh or we should reload the page content? 
            // Ideally `createAnnouncement` calls revalidatePath so a router.refresh() would fetch new data.
            window.location.reload(); // Simple brute force for now to ensure state sync, or I should import useRouter.
        }

        if (!selectedId) {
            handleCreateNew(); // Reset form
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
        e.stopPropagation();
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === announcements.length - 1) return;

        const newAnnouncements = [...announcements];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        [newAnnouncements[index], newAnnouncements[swapIndex]] = [newAnnouncements[swapIndex], newAnnouncements[index]];

        setAnnouncements(newAnnouncements); // Optimistic

        // Sync to DB
        const orders = newAnnouncements.map((a, i) => ({ id: a.id, displayOrder: i }));
        await updateAnnouncementOrder(orders);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("本当に削除しますか？")) return;
        await deleteAnnouncement(id);
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        if (selectedId === id) handleCreateNew();
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent selection
        await toggleAnnouncementStatus(id, !currentStatus);
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isActive: !currentStatus } : a));
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
            {/* LEFT COLUMN: List */}
            <div className="w-full md:w-1/3 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            お知らせ一覧
                            <span className="text-xs font-normal text-slate-400 bg-white border px-1.5 rounded">{announcements.length}</span>
                        </h3>
                        <button
                            onClick={handleCreateNew}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-full hover:bg-indigo-700 transition-colors shadow-sm flex items-center font-bold"
                        >
                            <span className="mr-1 text-lg leading-none">+</span> 新規作成
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="タイトルで検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {filteredAnnouncements.map((announcement, index) => {
                        const isSelected = selectedId === announcement.id;
                        return (
                            <div
                                key={announcement.id}
                                onClick={() => handleSelect(announcement)}
                                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${isSelected
                                        ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 z-10"
                                        : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${(announcement.priority ?? 0) === 2 ? 'bg-red-50 text-red-600 border-red-100' :
                                                    (announcement.priority ?? 0) === 1 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                {(announcement.priority ?? 0) === 2 ? '緊急' : (announcement.priority ?? 0) === 1 ? '注目' : '通常'}
                                            </span>
                                            {announcement.isActive ? (
                                                <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> 公開中
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 rounded">
                                                    非公開
                                                </span>
                                            )}
                                        </div>
                                        <h4 className={`text-sm font-bold truncate ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>
                                            {announcement.title}
                                        </h4>
                                    </div>

                                    {/* Sort Controls (Visible on Hover or Selected) */}
                                    <div className={`flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? "opacity-100" : ""} ${searchTerm ? "hidden" : ""}`}>
                                        <button
                                            onClick={(e) => handleMove(index, 'up', e)}
                                            disabled={index === 0}
                                            className="p-1 rounded hover:bg-slate-200 text-slate-400 disabled:opacity-30"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                                        </button>
                                        <button
                                            onClick={(e) => handleMove(index, 'down', e)}
                                            disabled={index === announcements.length - 1}
                                            className="p-1 rounded hover:bg-slate-200 text-slate-400 disabled:opacity-30"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <span className="text-xs text-slate-400 font-mono">
                                        {new Date(announcement.createdAt).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={(e) => handleToggleStatus(announcement.id, announcement.isActive, e)}
                                        className={`text-[10px] px-2 py-1 rounded-full border font-bold transition-colors ${announcement.isActive
                                                ? "bg-white border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200"
                                                : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                            }`}
                                    >
                                        {announcement.isActive ? "非公開にする" : "公開する"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* RIGHT COLUMN: Edit Form */}
            <div className="w-full md:w-2/3 flex flex-col">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            {selectedId ? (
                                <>
                                    <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm shadow-sm">✎</span>
                                    お知らせ編集
                                </>
                            ) : (
                                <>
                                    <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-3 text-sm shadow-sm">＋</span>
                                    新規お知らせ作成
                                </>
                            )}
                        </h3>
                        {selectedId && (
                            <span className="text-xs font-mono text-slate-400 bg-white px-2 py-1 border border-slate-200 rounded">ID: {selectedId}</span>
                        )}
                    </div>

                    <div className="p-8 flex-1 overflow-y-auto">
                        <div className="max-w-xl mx-auto space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    タイトル <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 shadow-sm text-base font-medium"
                                    placeholder="例: システムメンテナンスのお知らせ"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    優先度（表示バッジ）
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, priority: 0 })}
                                        className={`py-2 px-3 rounded-lg border text-sm font-bold transition-all ${formData.priority === 0
                                                ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        通常 (Low)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, priority: 1 })}
                                        className={`py-2 px-3 rounded-lg border text-sm font-bold transition-all ${formData.priority === 1
                                                ? "bg-amber-50 border-amber-500 text-amber-700 ring-1 ring-amber-500"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        注目 (Medium)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, priority: 2 })}
                                        className={`py-2 px-3 rounded-lg border text-sm font-bold transition-all ${formData.priority === 2
                                                ? "bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        緊急 (High)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    本文
                                </label>
                                <textarea
                                    rows={8}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 shadow-sm leading-relaxed"
                                    placeholder="お知らせの詳細内容を入力してください..."
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center gap-4">
                                <button
                                    onClick={handleSubmit}
                                    className={`flex-1 flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all transform active:scale-[0.98] ${selectedId
                                            ? "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 shadow-indigo-200"
                                            : "bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-green-200"
                                        }`}
                                >
                                    {selectedId ? "変更を保存する" : "この内容で作成する"}
                                </button>

                                {selectedId && (
                                    <button
                                        onClick={() => handleDelete(selectedId)}
                                        className="px-6 py-3.5 border border-red-200 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                    >
                                        削除
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
