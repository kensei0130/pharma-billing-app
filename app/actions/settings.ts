"use server";

import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getPeriodicSettings() {
    const daySetting = await db.select().from(systemSettings).where(eq(systemSettings.key, "payout_day_of_week"));
    const deadlineSetting = await db.select().from(systemSettings).where(eq(systemSettings.key, "deadline_days_before"));

    // Defaults: Thursday (4) payout, 2 days before deadline
    const payoutDayOfWeek = daySetting.length > 0 ? parseInt(daySetting[0].value) : 4;
    const deadlineDaysBefore = deadlineSetting.length > 0 ? parseInt(deadlineSetting[0].value) : 2;

    return { payoutDayOfWeek, deadlineDaysBefore };
}

export async function updatePeriodicSettings(payoutDayOfWeek: number, deadlineDaysBefore: number) {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        return { success: false, message: "権限がありません" };
    }

    try {
        // Upsert payout_day_of_week
        const existingDay = await db.select().from(systemSettings).where(eq(systemSettings.key, "payout_day_of_week"));
        if (existingDay.length > 0) {
            await db.update(systemSettings).set({ value: payoutDayOfWeek.toString() }).where(eq(systemSettings.key, "payout_day_of_week"));
        } else {
            await db.insert(systemSettings).values({ key: "payout_day_of_week", value: payoutDayOfWeek.toString() });
        }

        // Upsert deadline_days_before
        const existingDeadline = await db.select().from(systemSettings).where(eq(systemSettings.key, "deadline_days_before"));
        if (existingDeadline.length > 0) {
            await db.update(systemSettings).set({ value: deadlineDaysBefore.toString() }).where(eq(systemSettings.key, "deadline_days_before"));
        } else {
            await db.insert(systemSettings).values({ key: "deadline_days_before", value: deadlineDaysBefore.toString() });
        }

        revalidatePath("/admin/settings");
        revalidatePath("/ward"); // Ward page needs to know new settings for order form
        return { success: true, message: "設定を保存しました" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "エラーが発生しました" };
    }
}
