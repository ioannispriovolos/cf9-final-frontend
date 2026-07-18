import { useState } from "react";
import UserManagementPanel from "../components/panels/UserManagementPanel";
import SshManagementPanel from "../components/panels/SshManagementPanel";
import MetricsStatsPanel from "../components/panels/MetricsStatsPanel";

export default function AdminDashboardPage() {
    // Simple string state to track which panel to show
    const [activeTab, setActiveTab] = useState("users");

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-white text-black">
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-gray-200 bg-gray-50 p-6 flex flex-col gap-2">
                <h2 className="text-lg font-bold mb-4 tracking-tight">Admin Console</h2>

                <button
                    onClick={() => setActiveTab("users")}
                    className={`text-left w-full px-4 py-2 rounded text-sm transition-colors ${
                        activeTab === "users" ? "bg-black text-white font-medium" : "hover:bg-gray-200 text-gray-700"
                    }`}
                >
                    User Management
                </button>

                <button
                    onClick={() => setActiveTab("ssh")}
                    className={`text-left w-full px-4 py-2 rounded text-sm transition-colors ${
                        activeTab === "ssh" ? "bg-black text-white font-medium" : "hover:bg-gray-200 text-gray-700"
                    }`}
                >
                    SSH Management
                </button>

                <button
                    onClick={() => setActiveTab("metrics")}
                    className={`text-left w-full px-4 py-2 rounded text-sm transition-colors ${
                        activeTab === "metrics" ? "bg-black text-white font-medium" : "hover:bg-gray-200 text-gray-700"
                    }`}
                >
                    System Metrics
                </button>
            </aside>

            {/* Dynamic Content Panel Viewport */}
            <main className="grow p-8 bg-white">
                <div className="max-w-5xl mx-auto border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                    {activeTab === "users" && <UserManagementPanel />}
                    {activeTab === "ssh" && <SshManagementPanel />}
                    {activeTab === "metrics" && <MetricsStatsPanel />}
                </div>
            </main>
        </div>
    );
}