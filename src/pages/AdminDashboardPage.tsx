import {useCallback, useEffect, useState,} from "react";

import {ChartLine, Network, UserRound,} from "lucide-react";

import UserManagementPanel from "../components/panels/UserManagementPanel";

import SshManagementPanel from "../components/panels/SshManagementPanel";

import MetricsStatsPanel from "../components/panels/MetricsStatsPanel";

import { getViewerDashboard } from "@/api/dashboard";

import type { ViewerDashboardResponse } from "@/schemas/dashboard";

/**
 * Defines the available sections of the administrator dashboard.
 *
 * Each value corresponds to one functional area that can be selected
 * from the dashboard navigation:
 * - `users` displays user-management functionality;
 * - `ssh` displays device management and SSH execution functionality;
 * - `metrics` displays system and device statistics.
 */
type AdminDashboardTab =
    | "users"
    | "ssh"
    | "metrics";

/**
 * Renders the main dashboard interface for administrators.
 *
 * The component coordinates navigation between user management,
 * SSH/device management, and system metrics.
 *
 * Dashboard metrics are loaded lazily when the administrator first opens
 * the metrics tab rather than being requested immediately when the page
 * mounts.
 *
 * The component also provides a device-change callback to the SSH management
 * panel so dashboard statistics can be refreshed after device-related
 * operations such as creation, modification, or deletion.
 *
 * @returns The administrator dashboard interface.
 */
export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] =
        useState<AdminDashboardTab>("users");

    const [dashboardData, setDashboardData] =
        useState<ViewerDashboardResponse | null>(null);

    const [
        isLoadingDashboard,
        setIsLoadingDashboard,
    ] = useState(false);

    const [
        dashboardError,
        setDashboardError,
    ] = useState<string | null>(null);

    /**
     * Retrieves the latest dashboard statistics from the backend.
     *
     * The function manages the complete request lifecycle by enabling the
     * loading state, clearing previous errors, requesting the viewer-compatible
     * dashboard metrics, and storing the validated response.
     *
     * If retrieval fails, the error is logged for debugging and a readable
     * error message is stored for presentation by the user interface.
     *
     * The callback is memoized so it can safely be referenced by effects and
     * other memoized callbacks without being recreated on every render.
     *
     * @returns A Promise that resolves when the dashboard loading operation
     * has completed.
     */
    const loadDashboard = useCallback(async () => {
        try {
            setIsLoadingDashboard(true);
            setDashboardError(null);

            const response =
                await getViewerDashboard();

            setDashboardData(response);
        } catch (error) {
            console.error(
                "Failed to load dashboard:",
                error
            );

            setDashboardError(
                error instanceof Error
                    ? error.message
                    : "Failed to load dashboard metrics."
            );
        } finally {
            setIsLoadingDashboard(false);
        }
    }, []);

    /**
     * Lazily loads dashboard statistics when the administrator opens
     * the System Metrics tab.
     *
     * A backend request is triggered only when:
     * - the metrics tab is currently active;
     * - dashboard data has not already been loaded; and
     * - another dashboard request is not currently in progress.
     *
     * This avoids unnecessary dashboard requests when the administrator
     * only uses the user-management or SSH-management sections.
     */
    useEffect(() => {
        if (
            activeTab === "metrics" &&
            dashboardData === null &&
            !isLoadingDashboard
        ) {
            void loadDashboard();
        }
    }, [
        activeTab,
        dashboardData,
        isLoadingDashboard,
        loadDashboard,
    ]);

    /**
     * Refreshes dashboard statistics after device data has changed.
     *
     * This callback is intended to be passed to device-management components
     * such as `SshManagementPanel`. Successful device creation, modification,
     * or deletion can invoke the callback so metric values remain synchronized
     * with the current backend state.
     *
     * The callback is memoized to maintain a stable function reference between
     * renders.
     *
     * @returns A Promise that resolves after the dashboard metrics have been
     * refreshed.
     */
    const handleDeviceChanged = useCallback(
        async () => {
            await loadDashboard();
        },
        [loadDashboard]
    );

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-white text-black">
            <aside className="flex w-64 flex-col gap-2 border-r border-gray-200 bg-gray-50 p-6">
                <h2 className="mb-4 text-lg font-bold tracking-tight">
                    Admin Console
                </h2>

                <button
                    type="button"
                    onClick={() =>
                        setActiveTab("users")
                    }
                    className={`flex w-full items-center gap-2 rounded px-4 py-2 text-left text-sm transition-colors ${
                        activeTab === "users"
                            ? "bg-black font-medium text-white"
                            : "text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    <UserRound className="h-4 w-4" />
                    <span>User Management</span>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setActiveTab("ssh")
                    }
                    className={`flex w-full items-center gap-2 rounded px-4 py-2 text-left text-sm transition-colors ${
                        activeTab === "ssh"
                            ? "bg-black font-medium text-white"
                            : "text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    <Network className="h-4 w-4" />
                    <span>SSH Management</span>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setActiveTab("metrics")
                    }
                    className={`flex w-full items-center gap-2 rounded px-4 py-2 text-left text-sm transition-colors ${
                        activeTab === "metrics"
                            ? "bg-black font-medium text-white"
                            : "text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    <ChartLine className="h-4 w-4" />
                    <span>System Metrics</span>
                </button>
            </aside>

            <main className="grow bg-white p-8">
                <div className="mx-auto max-w-5xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    {activeTab === "users" && (
                        <UserManagementPanel />
                    )}

                    {activeTab === "ssh" && (
                        <SshManagementPanel
                            onDeviceChanged={
                                handleDeviceChanged
                            }
                        />
                    )}

                    {activeTab === "metrics" && (
                        <div className="space-y-5">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                    System Metrics
                                </h1>

                                <p className="mt-1 text-sm text-gray-500">
                                    Overview of the registered
                                    network infrastructure.
                                </p>
                            </div>

                            {dashboardError ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                    <p className="text-sm font-medium text-custom-dark-red">
                                        {dashboardError}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void loadDashboard()
                                        }
                                        className="mt-3 rounded-md bg-custom-dark-red px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : (
                                <MetricsStatsPanel
                                    dashboardData={
                                        dashboardData
                                    }
                                    isLoading={
                                        isLoadingDashboard
                                    }
                                />
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}