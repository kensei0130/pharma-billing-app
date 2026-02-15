"use server";

import { db } from "@/db";
import { announcements } from "@/db/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAnnouncements() {
    return await db.select().from(announcements).orderBy(asc(announcements.displayOrder), desc(announcements.createdAt));
}

export async function getActiveAnnouncements() {
    return await db.select().from(announcements)
        .where(eq(announcements.isActive, true))
        .orderBy(asc(announcements.displayOrder), desc(announcements.createdAt));
}

export async function createAnnouncement(data: { title: string; content?: string; priority: number }) {
    // Get max display_order to append to end
    const lastItem = await db.select({ maxOrder: sql<number>`max(${announcements.displayOrder})` }).from(announcements).get();
    const newOrder = (lastItem?.maxOrder ?? -1) + 1;

    await db.insert(announcements).values({
        title: data.title,
        content: data.content,
        priority: data.priority,
        displayOrder: newOrder,
    });
    revalidatePath("/admin/announcements");
    revalidatePath("/ward");
}

export async function updateAnnouncement(id: number, data: { title: string; content?: string; priority?: number }) {
    await db.update(announcements)
        .set({
            title: data.title,
            content: data.content,
            priority: data.priority,
        })
        .where(eq(announcements.id, id));
    revalidatePath("/admin/announcements");
    revalidatePath("/ward");
}

export async function updateAnnouncementOrder(items: { id: number; displayOrder: number }[]) {
    await db.transaction(async (tx) => {
        for (const item of items) {
            await tx.update(announcements)
                .set({ displayOrder: item.displayOrder })
                .where(eq(announcements.id, item.id));
        }
    });
    revalidatePath("/admin/announcements");
    revalidatePath("/ward");
}

export async function toggleAnnouncementStatus(id: number, isActive: boolean) {
    await db.update(announcements)
        .set({ isActive })
        .where(eq(announcements.id, id));
    revalidatePath("/admin/announcements");
    revalidatePath("/ward");
}

export async function deleteAnnouncement(id: number) {
    await db.delete(announcements).where(eq(announcements.id, id));
    revalidatePath("/admin/announcements");
    revalidatePath("/ward");
}
