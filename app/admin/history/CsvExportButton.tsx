"use client";

type Order = {
    id: number;
    wardName: string;
    type: string;
    status: string;
    orderDate: string;
    approvedDate: string | null;
    approvedBy: string | null;
    reason: string | null;
};

export default function CsvExportButton({ orders }: { orders: Order[] }) {

    const downloadCsv = () => {
        if (!orders.length) return;

        // Header
        const header = ["請求ID", "病棟", "種別", "ステータス", "請求日時", "理由", "承認者", "承認日時"];

        // Rows
        const rows = orders.map(order => [
            order.id,
            order.wardName,
            order.type,
            order.status,
            new Date(order.orderDate).toLocaleString('ja-JP'),
            order.reason || "",
            order.approvedBy || "",
            order.approvedDate ? new Date(order.approvedDate).toLocaleString('ja-JP') : "",
        ]);

        // Combine and escape CSV
        const csvContent = [
            header.join(","),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        // BOM for Excel compatibility
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `order_history_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={downloadCsv}
            disabled={orders.length === 0}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            CSVエクスポート
        </button>
    );
}
