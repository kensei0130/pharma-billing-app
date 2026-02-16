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
    // Get min display_order to prepend to start
    const firstItem = await db.select({ minOrder: sql<number>`min(${announcements.displayOrder})` }).from(announcements).get();
    // If table is empty, minOrder is null, start at 0.
    // If not empty, subtract 1 from minOrder to be before it.
    const newOrder = (firstItem?.minOrder ?? 0) - 1;

    await db.insert(announcements).values({
        title: data.title,
        content: data.content,
        priority: data.priority,
        displayOrder: newOrder,
    });
    revalidatePath("/admin/announcements");
    revalidatePath("/ward");
    revalidatePath("/login");
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
    revalidatePath("/login");
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
    revalidatePath("/login");
}

export async function toggleAnnouncementStatus(id: number, isActive: boolean) {
    await db.update(announcements)
        .set({ isActive })
        .where(eq(announcements.id, id));
    revalidatePath("/admin/announcements");
    revalidatePath("/ward");
    revalidatePath("/login");
}

export async function deleteAnnouncement(id: number) {
    await db.delete(announcements).where(eq(announcements.id, id));
    revalidatePath("/admin/announcements");
    revalidatePath("/ward");
    revalidatePath("/login");
}
