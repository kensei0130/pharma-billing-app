"use server";

import { db } from "@/db";
import { wardConstantDrugs, constantSets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createConstantSet(wardId: string, name: string) {
    // Auth check: User must be admin or the ward owner
    const session = await auth();
    if (!session?.user) return { success: false, message: "認証されていません" };

    // In production, verify wardId matches session.user.id if role is 'user'

    try {
        await db.insert(constantSets).values({
            wardId,
            name
        });
        revalidatePath("/ward");
        revalidatePath(`/admin/wards/${wardId}`);
        return { success: true, message: "セットを作成しました" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "作成に失敗しました" };
    }
}

export async function deleteConstantSet(setId: number) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "認証されていません" };

    try {
        await db.delete(constantSets).where(eq(constantSets.id, setId));
        revalidatePath("/ward");
        return { success: true, message: "セットを削除しました" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "削除に失敗しました" };
    }
}

type SetItemInput = {
    drugId: number;
    quantity: number;
};

export async function updateConstantSetItems(setId: number, items: SetItemInput[]) {
    const session = await auth();
    if (!session?.user) return { success: false, message: "認証されていません" };

    try {
        // Transaction approach: Delete all for set, then re-insert
        await db.transaction(async (tx) => {
            await tx.delete(wardConstantDrugs).where(eq(wardConstantDrugs.setId, setId));

            if (items.length > 0) {
                // Fetch wardId from set to populate the redundant column
                const set = await tx.query.constantSets.findFirst({
                    where: eq(constantSets.id, setId)
                });

                if (!set) throw new Error("Set not found");

                for (const [index, item] of items.entries()) {
                    await tx.insert(wardConstantDrugs).values({
                        setId: setId,
                        wardId: set.wardId, // Redundant but required by schema for now
                        drugId: item.drugId,
                        quantity: item.quantity,
                        displayOrder: index // Save order
                    });
                }
            }
        });

        revalidatePath("/ward");
        revalidatePath("/admin");
        return { success: true, message: "セット内容を保存しました" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "保存に失敗しました" };
    }
}
