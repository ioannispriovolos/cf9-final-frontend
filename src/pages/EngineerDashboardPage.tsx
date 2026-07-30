import {useState} from "react";
import {Network} from "lucide-react";
import SshManagementPanel from "@/components/panels/SshManagementPanel.tsx";


type EngineerDashboardTab =
    | "ssh";

export default function EngineerDashboardPage() {
    const [activeTab, setActiveTab] =
        useState<EngineerDashboardTab>("ssh");

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-white text-black">
            <aside className="flex w-64 flex-col gap-2 border-r border-gray-200 bg-gray-50 p-6">
                <h2 className="mb-4 text-lg font-bold tracking-tight">
                    Network Engineer Console
                </h2>

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
            </aside>
            <main className="grow bg-white p-8">
                <div className="mx-auto max-w-5xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">


                    {activeTab === "ssh" && (
                        <SshManagementPanel/>
                    )}
                </div>
            </main>
        </div>
    );
}