"use client";

import { useState } from "react";
import OrderCreateForm from "./components/OrderCreateForm";
import ConstantRequestForm from "./components/ConstantRequestForm";
import WardOrderHistory from "./components/WardOrderHistory";
import ConstantSetEditor from "./components/ConstantSetEditor";
import { getOrderDetails } from "@/app/actions/orders";
import Link from "next/link";
import { signOut } from "next-auth/react";
import AnnouncementTicker from "./components/AnnouncementTicker";

type User = {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
    role?: string;
};

type AnnouncementType = {
    id: number;
    title: string;
    content: string | null;
    priority: number | null;
    displayOrder: number | null;
    isActive: boolean;
    createdAt: string;
};

type Drug = {
    id: number;
    name: string;
    unit: string;
    category: string | null;
    furigana: string | null;
    allowComment: boolean;
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
    items?: ConstantDrug[];
};

export default function WardDashboardClient({
    wardId,
    drugs,
    constantDrugs,
    sets,
    orderHistory,
    periodicSettings,
    user,
    announcements
}: {
    wardId: string;
    drugs: Drug[],
    constantDrugs: ConstantDrug[],
    sets: ConstantSet[],
    orderHistory: Order[],
    periodicSettings: { payoutDayOfWeek: number; deadlineDaysBefore: number },
    user?: User,
    announcements: AnnouncementType[]
}) {
    const [activeTab, setActiveTab] = useState<"create" | "constant" | "history" | "set-editor">("create");
    const [editingOrder, setEditingOrder] = useState<EditingOrder | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleEdit = async (orderId: number) => {
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
        setIsMenuOpen(false); // Close menu on mobile selection
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    const tabs = [
        { id: "create", label: editingOrder ? "請求を編集中" : "新規請求作成", icon: "📝" },
        { id: "constant", label: "セット請求", icon: "📦" },
        { id: "history", label: "請求履歴", icon: "🕰️" },
        { id: "set-editor", label: "セット管理", icon: "⚙️" },
    ] as const;

    return (
        <div className="min-h-screen bg-slate-100/50 flex flex-col">
            {/* Header / Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Left: Hamburger & Logo */}
                        <div className="flex items-center gap-4">
                            {/* Mobile Hamburger (Left aligned) */}
                            <div className="min-[1200px]:hidden flex items-center">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="p-2 text-slate-500 hover:text-indigo-600 transition-colors rounded-lg active:bg-slate-100"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {isMenuOpen ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        )}
                                    </svg>
                                </button>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="bg-indigo-600 text-white p-1.5 rounded-lg hidden sm:block">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                </div>
                                <h1 className="text-lg font-bold text-slate-800 tracking-tight">薬剤管理システム</h1>
                                <div className="hidden min-[1200px]:block">
                                    <AnnouncementTicker announcements={announcements} />
                                </div>
                            </div>
                        </div>

                        {/* Right: Actions (Desktop & Mobile) */}
                        <div className="flex items-center gap-2 min-[1200px]:gap-6">
                            {user?.role === "admin" && (
                                <Link
                                    href="/admin"
                                    className="group flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-200 hover:bg-indigo-100"
                                >
                                    <span className="bg-indigo-500 rounded-full w-1.5 h-1.5 group-hover:animate-pulse"></span>
                                    <span className="hidden sm:inline">管理画面へ</span>
                                    <svg className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </Link>
                            )}

                            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                            <div className="hidden min-[1200px]:flex flex-col items-end mr-2">
                                <span className="text-sm font-bold text-slate-700">{user?.name}</span>
                                <span className="text-xs text-slate-500 font-mono">ID: {user?.id}</span>
                            </div>

                            <button
                                onClick={() => handleSignOut()}
                                className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                title="ログアウト"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="absolute top-16 left-0 w-full bg-white border-b border-indigo-100 shadow-xl z-40 min-[1200px]:hidden flex flex-col p-4 animate-in slide-in-from-top-2 duration-200 h-[calc(100vh-4rem)] overflow-y-auto">
                        <div className="space-y-2 mb-6">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">メニュー</div>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id as any)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all text-sm ${activeTab === tab.id
                                        ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 shadow-sm"
                                        : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <span className="text-xl">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="border-t border-slate-100 pt-4 mb-4">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">アカウント</div>
                            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl mb-3">
                                <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{user?.name}</div>
                                    <div className="text-xs text-slate-500 font-mono">{user?.id}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 px-4 flex-1 w-full">
                {/* Mobile Announcement Ticker */}
                <div className="min-[1200px]:hidden mb-4">
                    <AnnouncementTicker announcements={announcements} />
                </div>

                <div className="max-w-5xl mx-auto">
                    {/* Desktop Tab Navigation (Hidden on Mobile) */}
                    <div className="hidden min-[1200px]:flex justify-center mb-8">
                        <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm inline-flex">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id as any)}
                                    className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <span className="mr-2 text-lg">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
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
                                    periodicSettings={periodicSettings}
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
            </main>
        </div>
    );
}
