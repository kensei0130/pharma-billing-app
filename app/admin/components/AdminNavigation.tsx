"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AdminNavigation() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { name: "モニター", href: "/admin", exact: true },
        { name: "薬品請求管理", href: "/admin/billing" },
        { name: "定期請求管理", href: "/admin/periodic" },
        { name: "薬品マスタ", href: "/admin/drugs" },
        { name: "病棟マスタ", href: "/admin/wards" },
        { name: "お知らせ管理", href: "/admin/announcements" },
        { name: "請求履歴", href: "/admin/history" },
        { name: "システム設定", href: "/admin/settings" },
    ];

    return (
        <>
            {/* Desktop Navigation */}
            <div className="hidden min-[1200px]:flex items-center space-x-1">
                {navItems.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${isActive
                                ? "bg-indigo-500 text-white shadow-md shadow-indigo-900/20"
                                : "text-slate-400 hover:text-white hover:bg-white/10"
                                }`}
                        >
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            {/* Mobile Navigation Trigger */}
            <div className="min-[1200px]:hidden flex items-center">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-slate-300 hover:text-white focus:outline-none"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-16 left-0 w-full bg-slate-900 border-b border-indigo-500/10 shadow-xl z-50 min-[1200px]:hidden flex flex-col p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`block px-4 py-3 rounded-lg text-sm font-bold transition-colors ${isActive
                                    ? "bg-indigo-500 text-white"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            )}
        </>
    );
}
