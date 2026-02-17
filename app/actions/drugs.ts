"use server";

import { db } from "@/db";
import { drugs } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function addDrug(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        return { success: false, message: "権限がありません" };
    }

    const name = formData.get("name") as string;
    const furigana = formData.get("furigana") as string;
    const unit = formData.get("unit") as string;
    const category = formData.get("category") as string;
    const allowComment = formData.get("allowComment") === "on";

    if (!name || !unit) {
        return { success: false, message: "薬品名と単位は必須です" };
    }

    try {
        await db.insert(drugs).values({
            name,
            furigana,
            unit,
            category,
            allowComment,
            isInactive: false,
        });

        revalidatePath("/admin/drugs");
        return { success: true, message: "薬品を追加しました" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "エラーが発生しました" };
    }
}

export async function updateDrug(id: number, formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        return { success: false, message: "権限がありません" };
    }

    const name = formData.get("name") as string;
    const furigana = formData.get("furigana") as string;
    const unit = formData.get("unit") as string;
    const category = formData.get("category") as string;
    const allowComment = formData.get("allowComment") === "on";

    try {
        await db.update(drugs)
            .set({ name, furigana, unit, category, allowComment })
            .where(eq(drugs.id, id));

        revalidatePath("/admin/drugs");
        return { success: true, message: "薬品情報を更新しました" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "エラーが発生しました" };
    }
}

export async function deleteDrug(id: number) {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        return { success: false, message: "権限がありません" };
    }

    try {
        // Soft delete
        await db.update(drugs)
            .set({ isInactive: true })
            .where(eq(drugs.id, id));

        revalidatePath("/admin/drugs");
        return { success: true, message: "薬品を削除（無効化）しました" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "エラーが発生しました" };
    }
}
