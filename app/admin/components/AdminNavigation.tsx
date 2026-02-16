"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavigation() {
    const pathname = usePathname();

    const navItems = [
        { name: "承認待ち", href: "/admin", exact: true },
        { name: "薬品マスタ", href: "/admin/drugs" },
        { name: "病棟マスタ", href: "/admin/wards" },
        { name: "お知らせ管理", href: "/admin/announcements" },
        { name: "定期請求管理", href: "/admin/periodic" },
        { name: "請求履歴", href: "/admin/history" },
        { name: "システム設定", href: "/admin/settings" },
    ];

    return (
        <div className="flex items-center space-x-1">
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
    );
}
