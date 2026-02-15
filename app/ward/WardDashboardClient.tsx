"use client";

import { useState } from "react";
import OrderCreateForm from "./components/OrderCreateForm";
import ConstantRequestForm from "./components/ConstantRequestForm";
import WardOrderHistory from "./components/WardOrderHistory";
import ConstantSetEditor from "./components/ConstantSetEditor";
import { getOrderDetails } from "@/app/actions/orders";

type Drug = {
    id: number;
    name: string;
    unit: string;
    category: string | null;
    furigana: string | null;
};

type ConstantDrug = {
    id: number;
    drugId: number;
    name: string;
    quantity: number;
    unit: string;
    setId: number;
    setName: string;
};

type Order = {
    id: number;
    orderDate: string;
    type: string | null;
    status: string | null;
    approvedBy: string | null;
    approvedDate: string | null;
    items: {
        drug: { name: string };
        quantity: number;
    }[];
};

type EditingOrder = {
    id: number;
    type: "臨時" | "定時";
    items: { drugId: number; quantity: number }[];
};

type ConstantSet = {
    id: number;
    wardId: string;
    name: string;
};

export default function WardDashboardClient({
    wardId,
    drugs,
    constantDrugs,
    sets,
    orderHistory
}: {
    wardId: string;
    drugs: Drug[],
    constantDrugs: ConstantDrug[],
    sets: ConstantSet[],
    orderHistory: Order[]
}) {
    const [activeTab, setActiveTab] = useState<"create" | "constant" | "history" | "set-editor">("create");
    const [editingOrder, setEditingOrder] = useState<EditingOrder | null>(null);

    const handleEdit = async (orderId: number) => {
        // Fetch full order details
        const order = await getOrderDetails(orderId);
        if (order) {
            setEditingOrder({
                id: order.id,
                type: (order.type as "臨時" | "定時") || "臨時",
                items: order.items.map(item => ({
                    drugId: item.drugId,
                    quantity: item.quantity
                }))
            });
            setActiveTab("create");
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleCancelEdit = () => {
        setEditingOrder(null);
    };

    const handleTabChange = (tab: "create" | "constant" | "history" | "set-editor") => {
        if (editingOrder && tab !== "create") {
            if (!confirm("編集内容は破棄されますがよろしいですか？")) {
                return;
            }
            handleCancelEdit();
        }
        setActiveTab(tab);
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
                <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm inline-flex">
                    <button
                        onClick={() => handleTabChange("create")}
                        className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "create"
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        <span className="mr-2 text-lg">📝</span>
                        {editingOrder ? "請求を編集中" : "新規請求作成"}
                    </button>
                    <button
                        onClick={() => handleTabChange("constant")}
                        className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "constant"
                            ? "bg-green-600 text-white shadow-md shadow-green-200"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        <span className="mr-2 text-lg">📦</span>
                        セット請求
                    </button>
                    <button
                        onClick={() => handleTabChange("history")}
                        className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "history"
                            ? "bg-slate-600 text-white shadow-md shadow-slate-200"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        <span className="mr-2 text-lg">🕰️</span>
                        請求履歴
                    </button>
                    <button
                        onClick={() => handleTabChange("set-editor")}
                        className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "set-editor"
                            ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        <span className="mr-2 text-lg">⚙️</span>
                        セット管理
                    </button>
                </div>
            </div>

            {/* Tab Content with Fade/Slide Effect (Simulated via simple conditional for now) */}
            <div className="transition-all duration-300">
                {activeTab === "create" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingOrder ? "請求の編集" : "新規請求作成"}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {editingOrder ? "内容を修正して更新してください。" : "個別の薬品を選択して、臨時または定期請求を作成します。"}
                            </p>
                        </div>
                        <OrderCreateForm
                            drugs={drugs}
                            initialOrder={editingOrder}
                            onCancelEdit={handleCancelEdit}
                        />
                    </div>
                )}

                {activeTab === "constant" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-slate-800">セット請求</h2>
                            <p className="text-sm text-slate-500">登録済みの一覧から、在庫補充などの請求を一括で行います。</p>
                        </div>
                        <ConstantRequestForm constantDrugs={constantDrugs} />
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-slate-800">直近の請求履歴</h2>
                            <p className="text-sm text-slate-500">あなたが作成した請求のステータスを確認できます。</p>
                        </div>
                        <WardOrderHistory orders={orderHistory} onEdit={handleEdit} />
                    </div>
                )}

                {activeTab === "set-editor" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <ConstantSetEditor
                            wardId={wardId}
                            drugs={drugs}
                            constantDrugs={constantDrugs}
                            initialSets={sets}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
