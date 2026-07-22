import React, { useState } from "react";
import { Terminal, Server, Play, Plus, CheckSquare, Square, Trash2, Cpu, ShieldCheck } from "lucide-react";

// --- Types matching database schema ---
export interface Device {
    id?: number;
    title: string;
    manufacturer: string;
    model: string;
    ipAddress: string;
    sshPort: number;
    username: string;
    password?: string;
}

export default function SshManagementPanel() {
    // Tab State
    const [activeTab, setActiveTab] = useState<"terminal" | "devices">("terminal");

    // Device Inventory State (Mocked initial data matching DB structure)
    const [devices, setDevices] = useState<Device[]>([]);

    // Command Execution State
    const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>([1]);
    const [command, setCommand] = useState("");
    const [terminalOutput, setTerminalOutput] = useState<string>(
        "SSH Management Engine Initialized.\nSelect target devices from directory to execute commands.\n------------------------------------------------------------"
    );
    const [isExecuting, setIsExecuting] = useState(false);

    // New Device Form State (Matches CREATE TABLE schema)
    const [newDevice, setNewDevice] = useState({
        title: "",
        manufacturer: "",
        model: "",
        ipAddress: "",
        sshPort: 22,
        username: "",
        password: "",
    });

    // Toggle Single Device Selection
    const toggleDeviceSelect = (id: number) => {
        setSelectedDeviceIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Toggle Select All
    const toggleSelectAll = () => {
        if (selectedDeviceIds.length === devices.length) {
            setSelectedDeviceIds([]);
        } else {
            setSelectedDeviceIds(devices.map((d) => d.id!).filter(Boolean));
        }
    };

    // Dispatch Command Execution across selected devices
    const handleExecuteCommand = (e: React.SubmitEvent) => {
        e.preventDefault();
        if (!command.trim() || selectedDeviceIds.length === 0) return;

        setIsExecuting(true);
        const targets = devices.filter((d) => d.id && selectedDeviceIds.includes(d.id));

        const timestamp = new Date().toLocaleTimeString();
        let initialLog = `\n\n[${timestamp}] $ ${command}\n> Target Scope: ${targets.map((t) => t.title).join(", ")}`;
        setTerminalOutput((prev) => prev + initialLog);

        // Simulated async execution response
        setTimeout(() => {
            let executionResults = "";
            targets.forEach((target) => {
                executionResults += `\n[${target.title} (${target.ipAddress}:${target.sshPort})] OK:\n  -> Executed '${command}' via user '${target.username}'. Status code: 0.`;
            });

            setTerminalOutput((prev) => prev + executionResults);
            setIsExecuting(false);
            setCommand("");
        }, 1000);
    };

    // Add Device Handler
    const handleAddDevice = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDevice.title || !newDevice.ipAddress || !newDevice.username || !newDevice.password) return;

        const createdDevice: Device = {
            id: Date.now(),
            ...newDevice,
        };

        setDevices((prev) => [...prev, createdDevice]);
        setNewDevice({
            title: "",
            manufacturer: "",
            model: "",
            ipAddress: "",
            sshPort: 22,
            username: "",
            password: "",
        });
        setActiveTab("devices");
    };

    // Delete Device Handler (Soft delete in UI)
    const handleDeleteDevice = (id: number) => {
        setDevices((prev) => prev.filter((d) => d.id !== id));
        setSelectedDeviceIds((prev) => prev.filter((item) => item !== id));
    };

    return (
        <div className="w-full max-w-6xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden font-sans">
            {/* Header & Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50/50 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-red-600" />
                        SSH Fleet Execution Console
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Execute batch scripts and provision network inventory directly against database entries.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-gray-200/70 p-1 rounded-lg self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab("terminal")}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            activeTab === "terminal"
                                ? "bg-white text-black shadow-sm"
                                : "text-gray-600 hover:text-black"
                        }`}
                    >
                        <Terminal className="w-4 h-4" />
                        Interactive Terminal
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("devices")}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            activeTab === "devices"
                                ? "bg-white text-black shadow-sm"
                                : "text-gray-600 hover:text-black"
                        }`}
                    >
                        <Server className="w-4 h-4" />
                        Device Directory ({devices.length})
                    </button>
                </div>
            </div>

            {/* TAB 1: INTERACTIVE TERMINAL & MULTI-EXECUTION */}
            {activeTab === "terminal" && (
                <div className="p-4 sm:p-6 space-y-6">
                    {/* Device Selection Scope */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-gray-500" /> Target Scope ({selectedDeviceIds.length} Selected)
              </span>
                            <button
                                type="button"
                                onClick={toggleSelectAll}
                                className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                                {selectedDeviceIds.length === devices.length ? "Deselect All" : "Select All Devices"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {devices.map((device) => {
                                const isSelected = device.id ? selectedDeviceIds.includes(device.id) : false;
                                return (
                                    <div
                                        key={device.id}
                                        onClick={() => device.id && toggleDeviceSelect(device.id)}
                                        className={`cursor-pointer flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                                            isSelected
                                                ? "bg-white border-blue-500 shadow-xs ring-1 ring-blue-500"
                                                : "bg-white border-gray-200 hover:border-gray-300 opacity-70"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            {isSelected ? (
                                                <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                                            ) : (
                                                <Square className="w-4 h-4 text-gray-400 shrink-0" />
                                            )}
                                            <div className="truncate">
                                                <p className="font-bold text-gray-900 truncate">{device.title}</p>
                                                <p className="font-mono text-[10px] text-gray-500">
                                                    {device.manufacturer} {device.model} ({device.username}@{device.ipAddress}:{device.sshPort})
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Command Input Bar */}
                    <form onSubmit={handleExecuteCommand} className="flex flex-col sm:flex-row gap-2">
                        <div className="relative grow">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-mono text-xs text-gray-400">
                $
              </span>
                            <input
                                type="text"
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                placeholder={
                                    selectedDeviceIds.length > 0
                                        ? `Dispatch command to ${selectedDeviceIds.length} target node(s)...`
                                        : "Please select at least one target device above..."
                                }
                                disabled={selectedDeviceIds.length === 0 || isExecuting}
                                className="w-full pl-7 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono text-black focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={selectedDeviceIds.length === 0 || !command.trim() || isExecuting}
                            className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
                        >
                            <Play className="w-4 h-4 fill-current" />
                            {isExecuting ? "Executing..." : "Execute Command"}
                        </button>
                    </form>

                    {/* Terminal Console Output */}
                    <div className="relative bg-gray-950 rounded-xl p-4 border border-gray-800 font-mono text-xs text-green-400 shadow-inner">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-gray-500">
              <span className="flex items-center gap-1.5 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                <span className="ml-2 font-sans font-semibold">tty1 — stdout / stderr</span>
              </span>
                            <button
                                type="button"
                                onClick={() => setTerminalOutput("Terminal output cleared.\n------------------------------------------------------------")}
                                className="text-[10px] text-gray-400 hover:text-white transition-colors"
                            >
                                Clear Console
                            </button>
                        </div>
                        <pre className="whitespace-pre-wrap overflow-y-auto max-h-80 min-h-50 leading-relaxed">
              {terminalOutput}
            </pre>
                    </div>
                </div>
            )}

            {/* TAB 2: DEVICE DIRECTORY & SCHEMA FORM */}
            {activeTab === "devices" && (
                <div className="p-4 sm:p-6 space-y-8">
                    {/* Registration Form */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-red-600" /> Register New Device in Database
                        </h3>
                        <form onSubmit={handleAddDevice} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <input
                                type="text"
                                placeholder="Title (e.g. Edge Switch A)"
                                value={newDevice.title}
                                onChange={(e) => setNewDevice({ ...newDevice, title: e.target.value })}
                                required
                                className="p-2 border border-gray-300 rounded-lg text-xs bg-white text-black focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                            <input
                                type="text"
                                placeholder="Manufacturer (e.g. Cisco)"
                                value={newDevice.manufacturer}
                                onChange={(e) => setNewDevice({ ...newDevice, manufacturer: e.target.value })}
                                required
                                className="p-2 border border-gray-300 rounded-lg text-xs bg-white text-black focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                            <input
                                type="text"
                                placeholder="Model (e.g. Catalyst 9300)"
                                value={newDevice.model}
                                onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                                required
                                className="p-2 border border-gray-300 rounded-lg text-xs bg-white text-black focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                            <input
                                type="text"
                                placeholder="IP Address (e.g. 192.168.1.1)"
                                value={newDevice.ipAddress}
                                onChange={(e) => setNewDevice({ ...newDevice, ipAddress: e.target.value })}
                                required
                                className="p-2 border border-gray-300 rounded-lg text-xs bg-white text-black font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                            <input
                                type="number"
                                placeholder="SSH Port (Default 22)"
                                value={newDevice.sshPort}
                                onChange={(e) => setNewDevice({ ...newDevice, sshPort: parseInt(e.target.value) || 22 })}
                                required
                                className="p-2 border border-gray-300 rounded-lg text-xs bg-white text-black font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                            <input
                                type="text"
                                placeholder="SSH Username"
                                value={newDevice.username}
                                onChange={(e) => setNewDevice({ ...newDevice, username: e.target.value })}
                                required
                                className="p-2 border border-gray-300 rounded-lg text-xs bg-white text-black focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                            <input
                                type="password"
                                placeholder="SSH Password"
                                value={newDevice.password}
                                onChange={(e) => setNewDevice({ ...newDevice, password: e.target.value })}
                                required
                                className="p-2 border border-gray-300 rounded-lg text-xs bg-white text-black focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-1 h-full"
                            >
                                <Plus className="w-3.5 h-3.5" /> Save Device Record
                            </button>
                        </form>
                    </div>

                    {/* Device Directory Table */}
                    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-3.5 text-xs font-bold uppercase text-gray-500">Title</th>
                                <th className="p-3.5 text-xs font-bold uppercase text-gray-500">Hardware</th>
                                <th className="p-3.5 text-xs font-bold uppercase text-gray-500">IP Address</th>
                                <th className="p-3.5 text-xs font-bold uppercase text-gray-500">Port</th>
                                <th className="p-3.5 text-xs font-bold uppercase text-gray-500">Username</th>
                                <th className="p-3.5 text-xs font-bold uppercase text-gray-500 text-center">Delete</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                            {devices.length > 0 ? (
                                devices.map((device) => (
                                    <tr key={device.id} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="p-3.5 font-bold text-gray-900">{device.title}</td>
                                        <td className="p-3.5 text-gray-600">
                                            {device.manufacturer} <span className="text-gray-400">({device.model})</span>
                                        </td>
                                        <td className="p-3.5 font-mono text-gray-600">{device.ipAddress}</td>
                                        <td className="p-3.5 font-mono text-gray-600">{device.sshPort}</td>
                                        <td className="p-3.5 text-gray-700 font-mono">{device.username}</td>
                                        <td className="p-3.5 text-center">
                                            <button
                                                type="button"
                                                onClick={() => device.id && handleDeleteDevice(device.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Delete Device"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-400">
                                        No devices present in database.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};