import { auth } from "@/auth";
import { getPeriodicCyclesFromEvents } from "@/app/actions/periodic";
import PeriodicManager from "./PeriodicManager";

export default async function AdminPeriodicPage() {
    const session = await auth();

    // Fetch all events (we filter in client or via action args if needed later)
    const cycles = await getPeriodicCyclesFromEvents();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">定期請求管理</h2>
                </div>
            </div>

            <PeriodicManager
                cycles={cycles}
            />
        </div>
    );
}

