"use server";

import { db } from "@/db";
import { periodicEvents, systemSettings } from "@/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { getNextPayoutDates, getDeadline, toLocalISOString } from "@/lib/date-utils";
import { auth } from "@/auth";

// 1. Generate Events (Admin Only)
export async function generateUpcomingEvents(months: number = 3) {
    const session = await auth();
    if (session?.user?.role !== "admin") return { success: false, message: "権限がありません" };

    try {
        // Fetch settings
        const payoutDayRes = await db.select().from(systemSettings).where(eq(systemSettings.key, "payout_day_of_week"));
        const deadlineRes = await db.select().from(systemSettings).where(eq(systemSettings.key, "deadline_days_before"));

        const payoutDay = parseInt(payoutDayRes[0]?.value || "4"); // Default Thursday
        const deadlineDays = parseInt(deadlineRes[0]?.value || "2"); // Default 2 days before

        // Generate dates
        const count = months * 4; // Approx weeks
        const dates = getNextPayoutDates(new Date(), payoutDay, count);

        let createdCount = 0;

        for (const date of dates) {
            const dateStr = toLocalISOString(date);

            // Check if already exists
            const existing = await db.select().from(periodicEvents).where(eq(periodicEvents.payoutDate, dateStr));
            if (existing.length > 0) continue;

            // Calculate deadline
            const deadlineDate = getDeadline(date, deadlineDays);

            await db.insert(periodicEvents).values({
                payoutDate: dateStr,
                deadline: deadlineDate.toISOString(),
                status: "open" // Default to open
            });
            createdCount++;
        }

        return { success: true, message: `${createdCount}件の定期請求イベントを作成しました` };

    } catch (e) {
        console.error(e);
        return { success: false, message: "イベント生成中にエラーが発生しました" };
    }
}

// 2. Get Available Events for Ward (Open & Not Passed Deadline)
export async function getAvailableEvents() {
    const now = new Date();

    // Fetch all 'open' events
    const events = await db.select().from(periodicEvents)
        .where(eq(periodicEvents.status, "open"))
        .orderBy(desc(periodicEvents.payoutDate));

    // Filter by deadline (Client-side check logic or DB check)
    // DB stores deadline as ISO string.

    return events.map(e => ({
        ...e,
        isDeadlinePassed: new Date() > new Date(e.deadline)
    }));
}

// 3. Get All Events for Admin ( Management )
export async function getAdminEvents(limit: number = 20) {
    return await db.select().from(periodicEvents)
        .orderBy(desc(periodicEvents.payoutDate))
        .limit(limit);
}

// 4. Update Event Status
export async function updateEventStatus(id: number, status: "open" | "closed" | "completed" | "draft") {
    const session = await auth();
    if (session?.user?.role !== "admin") return { success: false, message: "権限がありません" };

    await db.update(periodicEvents)
        .set({ status })
        .where(eq(periodicEvents.id, id));

    return { success: true };
}
