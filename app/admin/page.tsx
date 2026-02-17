import { auth } from "@/auth";
import { getMonitorOrders } from "@/app/actions/orders";
import MonitorClient from "./monitor/MonitorClient";
import { redirect } from "next/navigation";

export default async function AdminPage() {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        redirect("/login");
    }

    const initialData = await getMonitorOrders();

    return (
        <div className="h-full">
            <MonitorClient initialData={initialData} />
        </div>
    );
}
