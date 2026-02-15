"use server";

import { db } from "@/db";
import { wards } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function addWard(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        return { success: false, message: "権限がありません" };
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    if (!id || !name || !password) {
        return { success: false, message: "ID、病棟名、パスワードは必須です" };
    }

    try {
        // Check if ID already exists
        const existing = await db.select().from(wards).where(eq(wards.id, id));
        if (existing.length > 0) {
            return { success: false, message: "このIDは既に使用されています" };
        }

        await db.insert(wards).values({
            id,
            name,
            password,
            role: "user",
            isInactive: false,
        });

        revalidatePath("/admin/wards");
        return { success: true, message: "病棟を追加しました" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "エラーが発生しました" };
    }
}

export async function updateWard(id: string, formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        return { success: false, message: "権限がありません" };
    }

    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    try {
        await db.update(wards)
            .set({ name, password })
            .where(eq(wards.id, id));

        revalidatePath("/admin/wards");
        return { success: true, message: "病棟情報を更新しました" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "エラーが発生しました" };
    }
}

export async function deleteWard(id: string) {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        return { success: false, message: "権限がありません" };
    }

    try {
        // Soft delete
        await db.update(wards)
            .set({ isInactive: true })
            .where(eq(wards.id, id));

        revalidatePath("/admin/wards");
        return { success: true, message: "病棟を削除（無効化）しました" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "エラーが発生しました" };
    }
}
