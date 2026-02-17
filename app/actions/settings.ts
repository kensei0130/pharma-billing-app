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

export async function getMonitorSettings() {
    const typeSetting = await db.select().from(systemSettings).where(eq(systemSettings.key, "monitor_target_type"));
    const rangeSetting = await db.select().from(systemSettings).where(eq(systemSettings.key, "monitor_date_range"));
    const pendingRangeSetting = await db.select().from(systemSettings).where(eq(systemSettings.key, "monitor_pending_date_range"));

    // Defaults: All types, Today (0)
    const targetType = typeSetting.length > 0 ? typeSetting[0].value : "all";
    const dateRange = rangeSetting.length > 0 ? parseInt(rangeSetting[0].value) : 0;
    const pendingDateRange = pendingRangeSetting.length > 0 ? parseInt(pendingRangeSetting[0].value) : 7; // Default 7 days for pending? Or 0? Let's say 7 to be safe, or 0? 
    // User wants to configure it. Defaulting to 7 seems reasonable to avoid cluttering with very old ignored items, or maybe 30?
    // Let's match rangeOptions. Default 7.

    return { targetType, dateRange, pendingDateRange };
}

export async function updateMonitorSettings(targetType: string, dateRange: number, pendingDateRange: number) {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        return { success: false, message: "権限がありません" };
    }

    try {
        // Upsert monitor_target_type
        const existingType = await db.select().from(systemSettings).where(eq(systemSettings.key, "monitor_target_type"));
        if (existingType.length > 0) {
            await db.update(systemSettings).set({ value: targetType }).where(eq(systemSettings.key, "monitor_target_type"));
        } else {
            await db.insert(systemSettings).values({ key: "monitor_target_type", value: targetType });
        }

        // Upsert monitor_date_range
        const existingRange = await db.select().from(systemSettings).where(eq(systemSettings.key, "monitor_date_range"));
        if (existingRange.length > 0) {
            await db.update(systemSettings).set({ value: dateRange.toString() }).where(eq(systemSettings.key, "monitor_date_range"));
        } else {
            await db.insert(systemSettings).values({ key: "monitor_date_range", value: dateRange.toString() });
        }

        // Upsert monitor_pending_date_range
        const existingPendingRange = await db.select().from(systemSettings).where(eq(systemSettings.key, "monitor_pending_date_range"));
        if (existingPendingRange.length > 0) {
            await db.update(systemSettings).set({ value: pendingDateRange.toString() }).where(eq(systemSettings.key, "monitor_pending_date_range"));
        } else {
            await db.insert(systemSettings).values({ key: "monitor_pending_date_range", value: pendingDateRange.toString() });
        }

        revalidatePath("/admin/settings");
        return { success: true, message: "モニター設定を保存しました" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "エラーが発生しました" };
    }
}
