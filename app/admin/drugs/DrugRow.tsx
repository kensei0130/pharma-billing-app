"use client";

import { useState } from "react";
import { updateDrug, deleteDrug } from "@/app/actions/drugs";

type Drug = {
    id: number;
    name: string;
    furigana: string | null;
    unit: string;
    category: string | null;
};

export default function DrugRow({ drug }: { drug: Drug }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async (formData: FormData) => {
        setIsLoading(true);
        const result = await updateDrug(drug.id, formData);
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
        await deleteDrug(drug.id);
        setIsLoading(false);
    };

    if (isEditing) {
        return (
            <tr className="bg-indigo-50/50">
                <td className="px-6 py-4" colSpan={4}>
                    <form action={handleUpdate} className="flex gap-4 items-center flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                name="name"
                                defaultValue={drug.name}
                                className="w-full text-sm rounded border-slate-300 px-2 py-1"
                                placeholder="薬品名"
                                required
                            />
                            <input
                                type="text"
                                name="furigana"
                                defaultValue={drug.furigana || ""}
                                className="w-full text-xs rounded border-slate-300 px-2 py-1 mt-1"
                                placeholder="ふりがな"
                            />
                        </div>
                        <div className="w-32">
                            <select name="category" defaultValue={drug.category || "その他"} className="w-full text-sm rounded border-slate-300 px-2 py-1">
                                <option value="内服薬">内服薬</option>
                                <option value="外用薬">外用薬</option>
                                <option value="注射薬">注射薬</option>
                                <option value="輸液">輸液</option>
                                <option value="その他">その他</option>
                            </select>
                        </div>
                        <div className="w-24">
                            <input
                                type="text"
                                name="unit"
                                defaultValue={drug.unit}
                                className="w-full text-sm rounded border-slate-300 px-2 py-1"
                                placeholder="単位"
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" disabled={isLoading} className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">
                                保存
                            </button>
                            <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1 bg-white border border-slate-300 text-slate-600 text-xs rounded hover:bg-slate-50">
                                キャンセル
                            </button>
                        </div>
                    </form>
                </td>
            </tr>
        );
    }

    return (
        <tr className="hover:bg-slate-50">
            <td className="px-6 py-4">
                <div className="text-sm font-medium text-slate-900">{drug.name}</div>
                <div className="text-xs text-slate-500">{drug.furigana}</div>
            </td>
            <td className="px-6 py-4 text-sm text-slate-600">{drug.category}</td>
            <td className="px-6 py-4 text-sm text-slate-600">{drug.unit}</td>
            <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
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
            </td>
        </tr>
    );
}
