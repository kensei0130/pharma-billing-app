"use client";

import { useState } from "react";
import { bulkApproveCycle } from "@/app/actions/periodic";
import { useRouter } from "next/navigation";

export default function PeriodicDetailClient({
    dateStr,
    hasPending
}: {
    dateStr: string,
    hasPending: boolean
}) {
    const router = useRouter();
    const [isApproving, setIsApproving] = useState(false);

    const handleBulkApprove = async () => {
        if (!confirm("⚠️ このクールの「承認待ち」オーダーを全て承認済みにしますか？\n（数量は申請通りに承認されます）")) {
            return;
        }

        setIsApproving(true);
        const result = await bulkApproveCycle(dateStr);
        setIsApproving(false);

        if (result.success) {
            alert(result.message);
            router.refresh();
        } else {
            alert("エラー: " + result.message);
        }
    };

    if (!hasPending) return null;

    return (
        <button
            onClick={handleBulkApprove}
            disabled={isApproving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-70 font-bold text-sm"
        >
            {isApproving ? "処理中..." : "一括承認する"}
        </button>
    );
}
