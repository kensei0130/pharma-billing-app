import { auth } from "@/auth";
import { getDrugs } from "@/db/queries";
import DrugManager from "./DrugManager";

export default async function DrugsPage() {
    const session = await auth();
    const drugs = await getDrugs();

    return (
        <div className="h-full space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">薬品マスタ管理</h2>
                </div>
            </div>

            <DrugManager initialDrugs={drugs} />
        </div>
    );
}
