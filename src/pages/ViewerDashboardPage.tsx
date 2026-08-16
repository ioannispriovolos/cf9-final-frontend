import {useCallback, useEffect, useState} from "react";
import {ChartLine} from "lucide-react";
import MetricsStatsPanel from "@/components/panels/MetricsStatsPanel.tsx";
import {getViewerDashboard} from "@/api/dashboard.ts";
import type {ViewerDashboardResponse} from "@/schemas/dashboard.ts";
import {toast} from "sonner";

/**
 * Renders the dashboard interface available to users with the VIEWER role.
 *
 * The page retrieves the latest viewer-accessible system metrics from the
 * backend and passes the validated dashboard data to the metrics presentation
 * component.
 *
 * Dashboard data is loaded when the page is first mounted. The component also
 * manages the loading state and reports retrieval failures through toast
 * notifications.
 *
 * @returns The viewer dashboard interface containing the available
 * system metrics.
 */
export default function ViewerDashboardPage() {

    /**
     * Stores the dashboard statistics retrieved from the backend.
     *
     * The data conforms to `ViewerDashboardResponse`, which represents the
     * validated response returned by the dashboard API layer.
     *
     * A null value indicates that dashboard data is currently unavailable
     * or that the most recent retrieval attempt failed.
     */
    const [dashboardData, setDashboardData] =
        useState<ViewerDashboardResponse | null>(null);

    /**
     * Indicates whether dashboard statistics are currently being retrieved.
     *
     * The state is initialized to true because the page begins loading
     * dashboard data immediately after it is mounted.
     */
    const [isLoadingDashboard, setIsLoadingDashboard] =
        useState(true);

    /**
     * Retrieves the latest viewer dashboard statistics from the backend.
     *
     * The function manages the complete loading lifecycle by enabling the
     * loading state before the request, storing the validated dashboard
     * response after a successful request, and disabling the loading state
     * when the operation completes.
     *
     * If the request fails, any previously stored dashboard data is cleared
     * and a user-facing error notification is displayed.
     *
     * The function is memoized with `useCallback` so that it maintains a
     * stable reference and can safely be used as a dependency of the
     * dashboard-loading effect.
     *
     * @returns A Promise that resolves when the dashboard retrieval operation
     * has completed.
     */
    const loadDashboard = useCallback(async () => {
        try {
            setIsLoadingDashboard(true);

            const data = await getViewerDashboard();

            setDashboardData(data);
        } catch (error) {
            /*
             * Clear potentially stale dashboard data when the latest
             * retrieval attempt cannot be completed successfully.
             */
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

    /**
     * Loads the viewer dashboard statistics when the page is first mounted.
     *
     * Because `loadDashboard` is memoized, its reference remains stable and
     * the effect does not repeatedly execute during ordinary component
     * re-renders.
     *
     * The returned Promise is intentionally ignored with `void` because
     * `useEffect` itself must not return a Promise. Errors are handled
     * internally by `loadDashboard`.
     */
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