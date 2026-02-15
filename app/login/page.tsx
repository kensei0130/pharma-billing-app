"use client";

import { useActionState } from "react";
import { authenticate } from "@/app/actions/authenticate";

export default function LoginPage() {
    const [errorMessage, dispatch, isPending] = useActionState(
        authenticate,
        undefined
    );

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">

            {/* Simple Card */}
            <div className="w-full max-w-md p-8 mx-4 bg-white rounded-2xl shadow-lg border border-slate-100">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-2xl text-white mb-4">
                        💊
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        薬剤請求システム
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        医薬品請求システムにログイン
                    </p>
                </div>

                {/* Form */}
                <form action={dispatch} className="space-y-5">
                    <div className="space-y-1.5">
                        <label htmlFor="wardId" className="block text-sm font-semibold text-slate-700">
                            ID
                        </label>
                        <div className="relative">
                            <input
                                id="wardId"
                                name="wardId"
                                type="text"
                                placeholder="病棟ID または 管理者ID"
                                required
                                className="w-full px-4 py-3 rounded-lg simple-input text-slate-900 placeholder:text-slate-400 text-sm font-medium outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                            パスワード
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 rounded-lg simple-input text-slate-900 placeholder:text-slate-400 text-sm font-medium outline-none"
                            />
                        </div>
                    </div>

                    <div
                        className="flex items-center space-x-2 text-sm text-red-600 font-medium min-h-[20px]"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {errorMessage && (
                            <span>{errorMessage}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        aria-disabled={isPending}
                        className="w-full py-3 px-4 rounded-lg text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isPending ? "認証中..." : "ログイン"}
                    </button>
                </form>
            </div>
            <div className="absolute bottom-6 text-xs text-slate-400">
                &copy; 2026 Hospital Pharmacy System
            </div>
        </div>
    );
}
