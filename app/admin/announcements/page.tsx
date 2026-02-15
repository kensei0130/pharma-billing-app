import { auth } from "@/auth";
import { getAnnouncements, createAnnouncement } from "@/app/actions/announcements";
import { redirect } from "next/navigation";
import AnnouncementManager from "./AnnouncementManager";

export default async function AdminAnnouncementsPage() {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        redirect("/login");
    }

    const announcements = await getAnnouncements();

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        お知らせ管理
                    </h2>
                </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">新しいお知らせを作成</h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>病棟のトップ画面に表示されるお知らせを作成します。</p>
                    </div>
                    <form action={async (formData) => {
                        "use server";
                        const title = formData.get("title") as string;
                        const content = formData.get("content") as string;
                        const priority = parseInt(formData.get("priority") as string || "0");
                        if (title) {
                            await createAnnouncement({ title, content, priority });
                        }
                    }} className="mt-5">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                            <div className="sm:col-span-4">
                                <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">タイトル</label>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="title"
                                        id="title"
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        placeholder="タイトル (必須)"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="priority" className="block text-sm font-medium leading-6 text-gray-900">優先度</label>
                                <div className="mt-2">
                                    <select
                                        id="priority"
                                        name="priority"
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                                        defaultValue="0"
                                    >
                                        <option value="0">低 (通常)</option>
                                        <option value="1">中 (注目)</option>
                                        <option value="2">高 (緊急)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="col-span-full">
                                <label htmlFor="content" className="block text-sm font-medium leading-6 text-gray-900">内容</label>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="content"
                                        id="content"
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                        placeholder="内容 (任意)"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                追加
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <AnnouncementManager initialAnnouncements={announcements} />
        </div>
    );
}
