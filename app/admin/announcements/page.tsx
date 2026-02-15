import { auth } from "@/auth";
import { getAnnouncements, createAnnouncement, updateAnnouncement, toggleAnnouncementStatus, deleteAnnouncement } from "@/app/actions/announcements";
import { redirect } from "next/navigation";

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
                        if (title) {
                            await createAnnouncement({ title, content });
                        }
                    }} className="mt-5 sm:flex sm:items-center">
                        <div className="w-full sm:max-w-xs">
                            <label htmlFor="title" className="sr-only">タイトル</label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="タイトル (必須)"
                                required
                            />
                        </div>
                        <div className="mt-3 w-full sm:max-w-xs sm:ml-4 sm:mt-0">
                            <label htmlFor="content" className="sr-only">内容</label>
                            <input
                                type="text"
                                name="content"
                                id="content"
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="内容 (任意)"
                            />
                        </div>
                        <button
                            type="submit"
                            className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:mt-0 sm:w-auto"
                        >
                            追加
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-white shadow sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-100">
                    {announcements.map((announcement) => (
                        <li key={announcement.id} className="flex flex-col sm:flex-row justify-between gap-x-6 py-5 px-4 sm:px-6 hover:bg-gray-50">
                            <div className="flex min-w-0 gap-x-4">
                                <div className="min-w-0 flex-auto">
                                    <div className="flex items-center gap-x-2">
                                        <p className="text-sm font-semibold leading-6 text-gray-900">{announcement.title}</p>
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${announcement.isActive ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-gray-50 text-gray-600 ring-gray-500/10'}`}>
                                            {announcement.isActive ? '公開中' : '非公開'}
                                        </span>
                                    </div>
                                    <p className="mt-1 truncate text-xs leading-5 text-gray-500">{announcement.content}</p>
                                    <p className="mt-1 truncate text-xs leading-5 text-gray-400">作成日: {new Date(announcement.createdAt).toLocaleDateString()} {new Date(announcement.createdAt).toLocaleTimeString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-x-4 mt-4 sm:mt-0">
                                <form action={async () => {
                                    "use server";
                                    await toggleAnnouncementStatus(announcement.id, !announcement.isActive);
                                }}>
                                    <button
                                        type="submit"
                                        className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 block"
                                    >
                                        {announcement.isActive ? '非公開にする' : '公開する'}
                                    </button>
                                </form>
                                <form action={async () => {
                                    "use server";
                                    await deleteAnnouncement(announcement.id);
                                }}>
                                    <button
                                        type="submit"
                                        className="rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-100 block"
                                    >
                                        削除
                                    </button>
                                </form>
                            </div>
                        </li>
                    ))}
                    {announcements.length === 0 && (
                        <li className="px-4 py-5 sm:px-6 text-center text-gray-500 text-sm">
                            お知らせはまだありません。
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
