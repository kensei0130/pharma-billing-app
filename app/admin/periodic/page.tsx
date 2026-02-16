import { auth } from "@/auth";
import { getPeriodicCycles, getPeriodicOrdersByDate } from "@/app/actions/periodic";
import PeriodicManager from "./PeriodicManager";
import { isDeadlinePassed } from "@/lib/date-utils";
import { getPeriodicSettings } from "@/app/actions/settings";

export default async function AdminPeriodicPage({
    searchParams
}: {
    searchParams: Promise<{ date?: string, startDate?: string, endDate?: string }>
}) {
    const params = await searchParams;
    const session = await auth();

    // 1. Determine Date Filter
    // Calculate defaults first to ensure consistency between Data Fetch and UI
    const now = new Date();
    const defaultStart = new Date().toISOString().split('T')[0]; // Default: Today

    // Default: Today + 7 days
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    const defaultEnd = nextWeek.toISOString().split('T')[0];

    // Use params if present, otherwise use defaults
    const filterStart = params.startDate || defaultStart;
    const filterEnd = params.endDate || defaultEnd;

    // Fetch cycles with consistent filter
    const cycles = await getPeriodicCycles(filterStart, filterEnd);

    // 2. Determine Selected Date
    // If param.date exists, use it.
    // Else, find the "Next Upcoming" cycle to select by default.
    let selectedDate = params.date ? decodeURIComponent(params.date) : null;

    if (!selectedDate && cycles.length > 0) {
        // Find first upcoming
        const nextUpcoming = cycles.find(c => c.status === "受付中"); // approximate "Upcoming"
        // If found, select it. If not (all past), select the latest one (top of list).
        if (nextUpcoming) {
            selectedDate = nextUpcoming.date;
        } else {
            selectedDate = cycles[0].date;
        }
    }

    // 3. Fetch Selected Orders
    const selectedOrders = selectedDate ? await getPeriodicOrdersByDate(selectedDate) : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">定期請求管理</h2>
                    <p className="text-slate-500 mt-1">週ごとの定期請求（クール）単位で承認・管理を行います。</p>
                </div>
            </div>

            <PeriodicManager
                cycles={cycles}
                selectedOrders={selectedOrders}
                selectedDate={selectedDate}
                filterStart={filterStart}
                filterEnd={filterEnd}
            />
        </div>
    );
}
