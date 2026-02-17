import { auth } from "@/auth";
import { getDrugs, getWardConstantDrugs, getWardOrders, getConstantSets } from "@/db/queries";
import { getActiveAnnouncements } from "@/app/actions/announcements";
import { getPeriodicSettings } from "@/app/actions/settings";
import WardDashboardClient from "./WardDashboardClient";

export default async function WardDashboard() {
    const session = await auth();
    const drugs = await getDrugs();
    const constantDrugs = session?.user?.id ? await getWardConstantDrugs(session.user.id) : [];
    const sets = session?.user?.id ? await getConstantSets(session.user.id) : [];
    const orderHistory = session?.user?.id ? await getWardOrders(session.user.id) : [];
    const announcements = await getActiveAnnouncements();
    const periodicSettings = await getPeriodicSettings();

    return (
        <WardDashboardClient
            wardId={session?.user?.id || ""}
            drugs={drugs}
            constantDrugs={constantDrugs}
            sets={sets}
            orderHistory={orderHistory}
            periodicSettings={periodicSettings}
            user={{
                ...session?.user,
                id: session?.user?.id || undefined
            }}
            announcements={announcements}
        />
    );
}
