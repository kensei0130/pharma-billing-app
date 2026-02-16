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
    // Defaults: "Next Upcoming" context usually implies seeing future ones and maybe immediate past.
    // Let's rely on actions default if null, or set explicitly.
    // User asked: "Filter default is next upcoming payout cool" -> Does this mean the list is filtered to only that? 
    // Or the SELECTION is that?
    // "Filter de period shitei dekiru to yoi" -> Range filter.
    // Let's set default list range to show recent past + future.

    // If no params, we use defaults in getPeriodicCycles (1 month ago to 3 months future)
    // But to allow user to see what filter is applied, we should probably generate them here if not present?
    // Let's let the action handle defaults for now and pass undefined.

    const cycles = await getPeriodicCycles(params.startDate, params.endDate);

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

    // Get filter values for UI input display (if undefined, default logic is hidden in action, let's expose or just leave empty)
    // If we want controlled inputs, we should pass values.
    const now = new Date();
    // Replicating default logic for UI display if needed, or pass undefined to let Client use its logic?
    // Client Component uses state `useState(filterStart)`.
    const defaultStart = new Date().toISOString().split('T')[0]; // Default: Today
    // Default: Today + 7 days
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    const defaultEnd = nextWeek.toISOString().split('T')[0];

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
                filterStart={params.startDate || defaultStart}
                filterEnd={params.endDate || defaultEnd}
            />
        </div>
    );
}
