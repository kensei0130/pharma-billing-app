"use client";

import { useState } from "react";
import { updateWard, deleteWard } from "@/app/actions/wards";

type Ward = {
    id: string;
    name: string;
    password: string;
    role: "admin" | "user";
};

export default function WardRow({ ward }: { ward: Ward }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async (formData: FormData) => {
        setIsLoading(true);
        const result = await updateWard(ward.id, formData);
        setIsLoading(false);
        if (result.success) {
            setIsEditing(false);
        } else {
            alert(result.message);
        }
    };

    const handleDelete = async () => {
        if (!confirm("本当に削除しますか？")) return;
        setIsLoading(true);
        await deleteWard(ward.id);
        setIsLoading(false);
    };

    if (isEditing) {
        return (
            <tr className="bg-indigo-50/50">
                <td className="px-6 py-4 text-sm font-mono text-slate-500">
                    {ward.id}
                </td>
                <td className="px-6 py-4">
                    <form action={handleUpdate} className="flex gap-4 items-center w-full" id={`form-${ward.id}`}>
                        <div className="flex-1">
                            <input
                                type="text"
                                name="name"
                                defaultValue={ward.name}
                                className="w-full text-sm rounded border-slate-300 px-2 py-1"
                                placeholder="病棟名"
                                required
                            />
                        </div>
                    </form>
                </td>
                <td className="px-6 py-4">
                    <input
                        type="text"
                        name="password"
                        defaultValue={ward.password}
                        className="w-full text-sm font-mono rounded border-slate-300 px-2 py-1"
                        placeholder="パスワード"
                        required
                        form={`form-${ward.id}`}
                    />
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button type="submit" form={`form-${ward.id}`} disabled={isLoading} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">
                            保存
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1 bg-white border border-slate-300 text-slate-600 text-xs rounded hover:bg-slate-50">
                            キャンセル
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="hover:bg-slate-50">
            <td className="px-6 py-4 text-sm font-mono text-slate-500">
                {ward.id}
            </td>
            <td className="px-6 py-4 text-sm font-medium text-slate-900">
                {ward.name}
                {ward.role === "admin" && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">管理者</span>}
            </td>
            <td className="px-6 py-4 text-sm font-mono text-slate-400">
                {ward.password}
            </td>
            <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                {ward.role !== "admin" && (
                    <>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-indigo-600 hover:text-indigo-900"
                        >
                            編集
                        </button>
                        <button
                            onClick={handleDelete}
                            className="text-red-500 hover:text-red-700"
                            disabled={isLoading}
                        >
                            削除
                        </button>
                    </>
                )}
            </td>
        </tr>
    );
}
