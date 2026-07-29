import {useCallback, useEffect, useState,} from "react";

import {ChartLine, Network, UserRound,} from "lucide-react";

import UserManagementPanel from "../components/panels/UserManagementPanel";

import SshManagementPanel from "../components/panels/SshManagementPanel";

import MetricsStatsPanel from "../components/panels/MetricsStatsPanel";

import { getViewerDashboard } from "@/api/dashboard";

import type { ViewerDashboardResponse } from "@/schemas/dashboard";

type AdminDashboardTab =
    | "users"
    | "ssh"
    | "metrics";

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
                                    <p className="text-sm font-medium text-red-700">
                                        {dashboardError}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void loadDashboard()
                                        }
                                        className="mt-3 rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
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