import {Network} from "lucide-react";
import SshManagementPanel from "@/components/panels/SshManagementPanel.tsx";

export default function EngineerDashboardPage() {

    return (
        <div className="flex min-h-[calc(100vh-4rem)] bg-white text-black">
            <aside className="flex w-64 flex-col gap-2 border-r border-gray-200 bg-gray-50 p-6">
                <h2 className="mb-4 text-lg font-bold tracking-tight">
                    Network Engineer Console
                </h2>

                <div className="flex items-center gap-2 rounded bg-black px-4 py-2 text-sm font-medium text-white">
                    <Network className="h-4 w-4" />
                    <span>SSH Management</span>
                </div>
            </aside>
            <main className="grow bg-white p-8">
                <div className="mx-auto max-w-5xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <SshManagementPanel/>
                </div>
            </main>
        </div>
    );
}