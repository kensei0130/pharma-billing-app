import { auth } from "@/auth";
import { db } from "@/db";
import { wards } from "@/db/schema";
import { eq } from "drizzle-orm";
import WardManager from "./WardManager";

async function getWards() {
    return await db.select().from(wards).where(eq(wards.isInactive, false));
}

export default async function WardsPage() {
    const session = await auth();
    const wardList = await getWards();

    return (
        <div className="h-full space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">病棟マスタ管理</h2>
                </div>
            </div>

            <WardManager initialWards={wardList} />
        </div>
    );
}
