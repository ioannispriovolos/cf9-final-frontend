import {useCallback, useEffect, useState} from "react";
import {ChartLine} from "lucide-react";
import MetricsStatsPanel from "@/components/panels/MetricsStatsPanel.tsx";
import {getViewerDashboard} from "@/api/dashboard.ts";
import type {ViewerDashboardResponse} from "@/schemas/dashboard.ts";
import {toast} from "sonner";


export default function ViewerDashboardPage() {

    const [dashboardData, setDashboardData] =
        useState<ViewerDashboardResponse | null>(null);

    const [isLoadingDashboard, setIsLoadingDashboard] =
        useState(true);

    const loadDashboard = useCallback(async () => {
        try {
            setIsLoadingDashboard(true);

            const data = await getViewerDashboard();

            setDashboardData(data);
        } catch (error) {
            setDashboardData(null);

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to load dashboard metrics."
            );
        } finally {
            setIsLoadingDashboard(false);
        }
    }, []);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-white text-black">
            <aside className="flex w-64 flex-col gap-2 border-r border-gray-200 bg-gray-50 p-6">
                <h2 className="mb-4 text-lg font-bold tracking-tight">
                    Viewer Console
                </h2>

                <div className="flex items-center gap-2 rounded bg-black px-4 py-2 text-sm font-medium text-white">
                    <ChartLine className="h-4 w-4" />
                    <span>System Metrics</span>
                </div>
            </aside>
            <main className="grow bg-white p-8">
                <div className="mx-auto max-w-5xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <MetricsStatsPanel
                        dashboardData={dashboardData}
                        isLoading={isLoadingDashboard}
                    />
                </div>
            </main>
        </div>
    );
}