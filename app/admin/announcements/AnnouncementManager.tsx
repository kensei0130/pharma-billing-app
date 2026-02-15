"use client";

import { useState } from "react";
import { updateAnnouncement, updateAnnouncementOrder, deleteAnnouncement, toggleAnnouncementStatus } from "@/app/actions/announcements";

type Announcement = {
    id: number;
    title: string;
    content: string | null;
    priority: number | null;
    displayOrder: number | null;
    isActive: boolean;
    createdAt: string;
};

export default function AnnouncementManager({ initialAnnouncements }: { initialAnnouncements: Announcement[] }) {
    const [announcements, setAnnouncements] = useState(initialAnnouncements);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<{ title: string; content: string; priority: number }>({ title: "", content: "", priority: 0 });

    const moveUp = async (index: number) => {
        if (index === 0) return;
        const newAnnouncements = [...announcements];
        const temp = newAnnouncements[index];
        newAnnouncements[index] = newAnnouncements[index - 1];
        newAnnouncements[index - 1] = temp;
        setAnnouncements(newAnnouncements);

        // Update order in DB
        const orders = newAnnouncements.map((a, i) => ({ id: a.id, displayOrder: i }));
        await updateAnnouncementOrder(orders);
    };

    const moveDown = async (index: number) => {
        if (index === announcements.length - 1) return;
        const newAnnouncements = [...announcements];
        const temp = newAnnouncements[index];
        newAnnouncements[index] = newAnnouncements[index + 1];
        newAnnouncements[index + 1] = temp;
        setAnnouncements(newAnnouncements);

        // Update order in DB
        const orders = newAnnouncements.map((a, i) => ({ id: a.id, displayOrder: i }));
        await updateAnnouncementOrder(orders);
    };

    const startEdit = (announcement: Announcement) => {
        setEditingId(announcement.id);
        setEditForm({
            title: announcement.title,
            content: announcement.content || "",
            priority: announcement.priority || 0,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ title: "", content: "", priority: 0 });
    };

    const saveEdit = async (id: number) => {
        await updateAnnouncement(id, editForm);
        setEditingId(null);
        // Optimistic update
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...editForm, content: editForm.content || null } : a));
    };

    const handleDelete = async (id: number) => {
        if (!confirm("本当に削除しますか？")) return;
        await deleteAnnouncement(id);
        setAnnouncements(prev => prev.filter(a => a.id !== id));
    };

    const handleToggle = async (id: number, currentStatus: boolean) => {
        await toggleAnnouncementStatus(id, !currentStatus);
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isActive: !currentStatus } : a));
    };

    return (
        <div className="bg-white shadow sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-100">
                {announcements.map((announcement, index) => (
                    <li key={announcement.id} className="flex flex-col sm:flex-row justify-between gap-x-6 py-5 px-4 sm:px-6 hover:bg-gray-50 items-center">
                        <div className="flex items-center gap-x-4 flex-1 w-full sm:w-auto">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col space-y-1">
                                <button
                                    onClick={() => moveUp(index)}
                                    disabled={index === 0}
                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                                </button>
                                <button
                                    onClick={() => moveDown(index)}
                                    disabled={index === announcements.length - 1}
                                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>
                            </div>

                            {editingId === announcement.id ? (
                                <div className="flex-1 space-y-3 w-full">
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        placeholder="タイトル"
                                    />
                                    <input
                                        type="text"
                                        value={editForm.content}
                                        onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        placeholder="内容"
                                    />
                                    <select
                                        value={editForm.priority}
                                        onChange={e => setEditForm({ ...editForm, priority: parseInt(e.target.value) })}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                                    >
                                        <option value="0">低 (通常)</option>
                                        <option value="1">中 (注目)</option>
                                        <option value="2">高 (緊急)</option>
                                    </select>
                                    <div className="flex space-x-2">
                                        <button onClick={() => saveEdit(announcement.id)} className="text-sm text-white bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-500">保存</button>
                                        <button onClick={cancelEdit} className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">キャンセル</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="min-w-0 flex-auto">
                                    <div className="flex items-center gap-x-2">
                                        <p className="text-sm font-semibold leading-6 text-gray-900">{announcement.title}</p>
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset 
                                            ${(announcement.priority ?? 0) === 2 ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                (announcement.priority ?? 0) === 1 ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                                                    'bg-blue-50 text-blue-700 ring-blue-600/20'}`}>
                                            {(announcement.priority ?? 0) === 2 ? '高' : (announcement.priority ?? 0) === 1 ? '中' : '低'}
                                        </span>
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${announcement.isActive ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
                                            {announcement.isActive ? '公開中' : '非公開'}
                                        </span>
                                    </div>
                                    <p className="mt-1 truncate text-xs leading-5 text-gray-500">{announcement.content}</p>
                                    <p className="mt-1 truncate text-xs leading-5 text-gray-400">作成日: {new Date(announcement.createdAt).toLocaleDateString()} {new Date(announcement.createdAt).toLocaleTimeString()}</p>
                                </div>
                            )}
                        </div>

                        {!editingId && (
                            <div className="flex items-center gap-x-4 mt-4 sm:mt-0">
                                <button
                                    onClick={() => startEdit(announcement)}
                                    className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 block"
                                >
                                    編集
                                </button>
                                <button
                                    onClick={() => handleToggle(announcement.id, announcement.isActive)}
                                    className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 block"
                                >
                                    {announcement.isActive ? '非公開' : '公開'}
                                </button>
                                <button
                                    onClick={() => handleDelete(announcement.id)}
                                    className="rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-100 block"
                                >
                                    削除
                                </button>
                            </div>
                        )}
                    </li>
                ))}
                {announcements.length === 0 && (
                    <li className="px-4 py-5 sm:px-6 text-center text-gray-500 text-sm">
                        お知らせはまだありません。
                    </li>
                )}
            </ul>
        </div>
    );
}
