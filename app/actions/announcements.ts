"use server";

import { db } from "@/db";
import { announcements } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAnnouncements() {
    return await db.select().from(announcements).orderBy(desc(announcements.priority), desc(announcements.createdAt));
}

export async function getActiveAnnouncements() {
    return await db.select().from(announcements)
        .where(eq(announcements.isActive, true))
        .orderBy(desc(announcements.priority), desc(announcements.createdAt));
}

export async function createAnnouncement(data: { title: string; content?: string; priority: number }) {
    await db.insert(announcements).values({
        title: data.title,
        content: data.content,
        priority: data.priority,
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
