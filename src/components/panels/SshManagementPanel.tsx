import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Terminal, Server, Play, Plus, CheckSquare, Square, Trash2, Cpu, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
    getDevices,
    createDevice,
    deleteDevice,
    executeCommand,
} from "@/api/devices";

import {
    type Device,
    type CreateDevicePayload,
    createDeviceSchema, type CreateDeviceFormInput,
} from "@/schemas/devices";
import * as React from "react";

export default function SshManagementPanel() {
    // ---------------- Tabs ----------------

    const [activeTab, setActiveTab] = useState<"terminal" | "devices">("terminal");

// ---------------- Devices ----------------
    const PAGE_SIZE = 6;

    const [devices, setDevices] = useState<Device[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [isLoadingDevices, setIsLoadingDevices] = useState(false);

    const [selectionDevices, setSelectionDevices] =
        useState<Device[]>([]);

    const [selectionCurrentPage, setSelectionCurrentPage] =
        useState(0);

    const [selectionTotalPages, setSelectionTotalPages] =
        useState(0);

    const [selectionTotalElements, setSelectionTotalElements] =
        useState(0);

    const [isLoadingSelectionDevices, setIsLoadingSelectionDevices] =
        useState(false);

// ---------------- Terminal ----------------

    const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>([]);
    const [command, setCommand] = useState("");

    const [terminalOutput, setTerminalOutput] = useState(
        `SSH Management Engine Initialized.
Select target devices from directory.
------------------------------------------------------------`
    );

    const [isExecuting, setIsExecuting] = useState(false);

// ---------------- Device Form ----------------

    const {
        register,
        handleSubmit,
        reset,
        formState: {
            errors,
            isSubmitting,
        },
    } = useForm<
        CreateDeviceFormInput,
        unknown,
        CreateDevicePayload
    >({
        resolver: zodResolver(createDeviceSchema),
        defaultValues: {
            title: "",
            manufacturer: "",
            model: "",
            ipAddress: "",
            sshPort: 22,
            username: "",
            password: "",
        },
    });

// ---------------- Fetch Devices ----------------

    const loadDevices = async (page: number = 0) => {
        try {
            setIsLoadingDevices(true);

            const devicePage = await getDevices(
                page,
                PAGE_SIZE,
            );

            setDevices(devicePage.content);
            setCurrentPage(devicePage.page);
            setTotalPages(devicePage.totalPages);
            setTotalElements(devicePage.totalElements);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to load devices."
            );
        } finally {
            setIsLoadingDevices(false);
        }
    };

    useEffect(() => {
        void loadDevices(currentPage);
    }, [currentPage]);

    const handlePreviousPage = () => {
        setCurrentPage((previousPage) =>
            Math.max(previousPage - 1, 0)
        );
    };

    const handleNextPage = () => {
        setCurrentPage((previousPage) =>
            Math.min(previousPage + 1, totalPages - 1)
        );
    };

    const handlePageChange = (page: number) => {
        if (
            page >= 0 &&
            page < totalPages &&
            page !== currentPage
        ) {
            setCurrentPage(page);
        }
    };

    const loadSelectionDevices = async (
        page: number
    ) => {
        try {
            setIsLoadingSelectionDevices(true);

            const result = await getDevices(
                page,
                PAGE_SIZE
            );

            setSelectionDevices(result.content);
            setSelectionTotalPages(result.totalPages);
            setSelectionTotalElements(result.totalElements);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to load devices."
            );
        } finally {
            setIsLoadingSelectionDevices(false);
        }
    };

    useEffect(() => {
        void loadSelectionDevices(
            selectionCurrentPage
        );
    }, [selectionCurrentPage]);

    const selectionPageDeviceIds =
        selectionDevices
            .map((device) => device.id)
            .filter(
                (id): id is number =>
                    id !== undefined
            );

    const areAllCurrentPageDevicesSelected =
        selectionPageDeviceIds.length > 0 &&
        selectionPageDeviceIds.every((id) =>
            selectedDeviceIds.includes(id)
        );

    const toggleSelectAllSelectionPage = () => {
        if (areAllCurrentPageDevicesSelected) {
            setSelectedDeviceIds((previousIds) =>
                previousIds.filter(
                    (id) =>
                        !selectionPageDeviceIds.includes(id)
                )
            );
        } else {
            setSelectedDeviceIds((previousIds) => [
                ...new Set([
                    ...previousIds,
                    ...selectionPageDeviceIds,
                ]),
            ]);
        }
    };

    const handleSelectionPreviousPage = () => {
        setSelectionCurrentPage((previousPage) =>
            Math.max(previousPage - 1, 0)
        );
    };

    const handleSelectionNextPage = () => {
        setSelectionCurrentPage((previousPage) =>
            Math.min(
                previousPage + 1,
                selectionTotalPages - 1
            )
        );
    };

    const handleSelectionPageChange = (
        pageIndex: number
    ) => {
        if (
            pageIndex >= 0 &&
            pageIndex < selectionTotalPages &&
            pageIndex !== selectionCurrentPage
        ) {
            setSelectionCurrentPage(pageIndex);
        }
    };

// ---------------- Add Device ----------------

    const onAddDevice = async (
        payload: CreateDevicePayload
    ) => {
        try {
            await createDevice(payload);

            toast.success("Device registered.");

            reset({
                title: "",
                manufacturer: "",
                model: "",
                ipAddress: "",
                sshPort: 22,
                username: "",
                password: "",
            });

            await Promise.all([
                loadDevices(currentPage),
                loadSelectionDevices(
                    selectionCurrentPage
                ),
            ]);

            setActiveTab("devices");
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to create device."
            );
        }
    };

// ---------------- Delete Device ----------------

    const handleDeleteDevice = async (deviceId: number) => {
        try {
            await deleteDevice(deviceId);

            setSelectedDeviceIds((prev) =>
                prev.filter((id) => id !== deviceId)
            );

            const directoryShouldGoBack =
                devices.length === 1 &&
                currentPage > 0;

            const selectionShouldGoBack =
                selectionDevices.length === 1 &&
                selectionCurrentPage > 0;

            const nextDirectoryPage =
                directoryShouldGoBack
                    ? currentPage - 1
                    : currentPage;

            const nextSelectionPage =
                selectionShouldGoBack
                    ? selectionCurrentPage - 1
                    : selectionCurrentPage;

            if (nextDirectoryPage !== currentPage) {
                setCurrentPage(nextDirectoryPage);
            } else {
                await loadDevices(currentPage);
            }

            if (
                nextSelectionPage !==
                selectionCurrentPage
            ) {
                setSelectionCurrentPage(
                    nextSelectionPage
                );
            } else {
                await loadSelectionDevices(
                    selectionCurrentPage
                );
            }

            toast.success(
                "Device deleted successfully."
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to delete device."
            );
        }
    };
// ---------------- Execute Command ----------------

    const onExecuteCommand = async (
        e: React.SubmitEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        const trimmedCommand = command.trim();

        if (!trimmedCommand) {
            toast.error("Enter a command.");
            return;
        }

        if (selectedDeviceIds.length === 0) {
            toast.error("Select at least one device.");
            return;
        }

        try {
            setIsExecuting(true);

            const result = await executeCommand({
                command: trimmedCommand,
                deviceIds: selectedDeviceIds,
            });

            const terminalText = result.results
                .map((deviceResult) => {
                    const status = deviceResult.successful
                        ? "SUCCESS"
                        : "FAILED";

                    const message = deviceResult.successful
                        ? deviceResult.output ||
                        "Command completed without output."
                        : deviceResult.errorMessage ||
                        deviceResult.errorOutput ||
                        "SSH execution failed.";

                    return [
                        "========================================",
                        `Device: ${deviceResult.deviceTitle}`,
                        `IP: ${deviceResult.ipAddress}`,
                        `Status: ${status}`,
                        `Duration: ${deviceResult.durationMs} ms`,
                        "----------------------------------------",
                        message,
                    ].join("\n");
                })
                .join("\n\n");

            setTerminalOutput((previousOutput) =>
                previousOutput
                    ? `${previousOutput}\n\n${terminalText}`
                    : terminalText
            );

            if (result.failedDevices === 0) {
                toast.success(
                    `Command completed successfully on ${result.successfulDevices} device(s).`
                );
            } else if (result.successfulDevices === 0) {
                toast.error(
                    `Command failed on ${result.failedDevices} device(s).`
                );
            } else {
                toast.warning(
                    `${result.successfulDevices} device(s) succeeded and ${result.failedDevices} failed.`
                );
            }

            setCommand("");
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "SSH execution failed.";

            setTerminalOutput((previousOutput) =>
                previousOutput
                    ? `${previousOutput}\n\nERROR: ${message}`
                    : `ERROR: ${message}`
            );

            toast.error(message);
        } finally {
            setIsExecuting(false);
        }
    };
// ---------------- Device Selection ----------------

    const toggleDeviceSelect = (id: number) => {
        setSelectedDeviceIds((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden font-sans">
            {/* Header & Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50/50 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-custom-dark-red" />
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
                        Device Directory
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
                                <ShieldCheck className="w-4 h-4 text-gray-500" />

                                Target Scope (
                                {selectedDeviceIds.length} Selected)
                            </span>

                            <button
                                type="button"
                                onClick={
                                    toggleSelectAllSelectionPage
                                }
                                disabled={
                                    isLoadingSelectionDevices ||
                                    selectionDevices.length === 0
                                }
                                className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {areAllCurrentPageDevicesSelected
                                    ? "Deselect Current Page"
                                    : "Select Current Page"}
                            </button>
                        </div>

                        {isLoadingSelectionDevices ? (
                            <div className="p-8 text-center text-xs text-gray-500">
                                Loading devices...
                            </div>
                        ) : selectionDevices.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {selectionDevices.map((device) => {
                                    const isSelected =
                                        device.id !== undefined &&
                                        selectedDeviceIds.includes(
                                            device.id
                                        );

                                    return (
                                        <div
                                            key={device.id}
                                            onClick={() =>
                                                device.id !== undefined &&
                                                toggleDeviceSelect(
                                                    device.id
                                                )
                                            }
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
                                                    <p className="font-bold text-gray-900 truncate">
                                                        {device.title}
                                                    </p>

                                                    <p className="font-mono text-[10px] text-gray-500">
                                                        {device.manufacturer}{" "}
                                                        {device.model} (
                                                        {device.username}@
                                                        {device.ipAddress}:
                                                        {device.sshPort})
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs text-gray-400">
                                No devices present in database.
                            </div>
                        )}

                        {/* Device Selection Pagination */}
                        {selectionTotalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                    Page{" "}
                                    {selectionCurrentPage + 1} of{" "}
                                    {selectionTotalPages}

                                    {selectionTotalElements > 0 && (
                                        <span>
                                            {" "}
                                                            · {selectionTotalElements}{" "}
                                                            devices
                                        </span>
                                    )}
                                </p>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={
                                            handleSelectionPreviousPage
                                        }
                                        disabled={
                                            selectionCurrentPage === 0 ||
                                            isLoadingSelectionDevices
                                        }
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>

                                    {Array.from(
                                        {
                                            length:
                                            selectionTotalPages,
                                        },
                                        (_, pageIndex) =>
                                            pageIndex
                                    ).map((pageIndex) => (
                                        <button
                                            key={pageIndex}
                                            type="button"
                                            onClick={() =>
                                                handleSelectionPageChange(
                                                    pageIndex
                                                )
                                            }
                                            disabled={
                                                isLoadingSelectionDevices
                                            }
                                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                                                selectionCurrentPage ===
                                                pageIndex
                                                    ? "bg-black text-white"
                                                    : "border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {pageIndex + 1}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={
                                            handleSelectionNextPage
                                        }
                                        disabled={
                                            selectionCurrentPage >=
                                            selectionTotalPages -
                                            1 ||
                                            isLoadingSelectionDevices
                                        }
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Command Input Bar */}
                    <form onSubmit={onExecuteCommand} className="flex flex-col sm:flex-row gap-2">
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
                            className="px-5 py-2 bg-custom-dark-red text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
                        >
                            <Play className="w-4 h-4 fill-current" />
                            {isExecuting ? "Executing..." : "Execute Command"}
                        </button>
                    </form>

                    {/* Terminal Console Output */}
                    <div className="relative bg-gray-950 rounded-xl p-4 border border-gray-800 font-mono text-xs text-green-400 shadow-inner">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-gray-500">
                          <span className="flex items-center gap-1.5 text-[11px]">
                            <span className="w-2.5 h-2.5 rounded-full bg-custom-dark-red inline-block" />
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
                            <Plus className="w-4 h-4 text-custom-dark-red" /> Register New Device in Database
                        </h3>
                        <form onSubmit={handleSubmit(onAddDevice)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" noValidate>
                            <div className="flex flex-col">
                                <input
                                    type="text"
                                    placeholder="Title (e.g. Edge Switch A)"
                                    {...register("title")}
                                    aria-invalid={Boolean(errors.title)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white text-black focus:outline-none focus:ring-1 focus:ring-custom-dark-red"
                                />
                                {errors.title && (
                                    <p className="text-xs text-custom-dark-red">
                                        {errors.title.message}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <input
                                    type="text"
                                    placeholder="Manufacturer (e.g. Cisco)"
                                    {...register("manufacturer")}
                                    aria-invalid={Boolean(errors.manufacturer)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white text-black focus:outline-none focus:ring-1 focus:ring-custom-dark-red"
                                />
                                {errors.manufacturer && (
                                    <p className="text-xs text-custom-dark-red">
                                        {errors.manufacturer.message}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <input
                                    type="text"
                                    placeholder="Model (e.g. Catalyst 9300)"
                                    {...register("model")}
                                    aria-invalid={Boolean(errors.model)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white text-black focus:outline-none focus:ring-1 focus:ring-custom-dark-red"
                                />
                                {errors.model && (
                                    <p className="text-xs text-custom-dark-red">
                                        {errors.model.message}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <input
                                    type="text"
                                    placeholder="IP Address (e.g. 192.168.1.1)"
                                    {...register("ipAddress")}
                                    aria-invalid={Boolean(errors.ipAddress)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white text-black font-mono focus:outline-none focus:ring-1 focus:ring-custom-dark-red"
                                />
                                {errors.ipAddress && (
                                    <p className="text-xs text-custom-dark-red">
                                        {errors.ipAddress.message}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <input
                                    type="number"
                                    placeholder="SSH Port (Default 22)"
                                    {...register("sshPort")}
                                    aria-invalid={Boolean(errors.sshPort)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white text-black font-mono focus:outline-none focus:ring-1 focus:ring-custom-dark-red"
                                />
                                {errors.sshPort && (
                                    <p className="text-xs text-custom-dark-red">
                                        {errors.sshPort.message}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <input
                                    type="text"
                                    placeholder="SSH Username"
                                    {...register("username")}
                                    aria-invalid={Boolean(errors.username)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white text-black focus:outline-none focus:ring-1 focus:ring-custom-dark-red"
                                />
                                {errors.username && (
                                    <p className="text-xs text-custom-dark-red">
                                        {errors.username.message}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <input
                                    type="password"
                                    placeholder="SSH Password"
                                    {...register("password")}
                                    aria-invalid={Boolean(errors.password)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white text-black focus:outline-none focus:ring-1 focus:ring-custom-dark-red"
                                />
                                {errors.password && (
                                    <p className="text-xs text-custom-dark-red">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-1 h-full"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                {isSubmitting ? "Saving..." : "Save Device Record"}

                            </button>
                        </form>
                    </div>

                    {/* Device Directory Table */}
                    <div className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
                        <div className="w-full overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-3.5 text-xs font-bold uppercase text-gray-500">
                                        Title
                                    </th>

                                    <th className="p-3.5 text-xs font-bold uppercase text-gray-500">
                                        Manufacturer
                                    </th>

                                    <th className="p-3.5 text-xs font-bold uppercase text-gray-500">
                                        Model
                                    </th>

                                    <th className="p-3.5 text-xs font-bold uppercase text-gray-500">
                                        IP Address
                                    </th>

                                    <th className="p-3.5 text-xs font-bold uppercase text-gray-500">
                                        Port
                                    </th>

                                    <th className="p-3.5 text-xs font-bold uppercase text-gray-500">
                                        Username
                                    </th>

                                    <th className="p-3.5 text-xs font-bold uppercase text-gray-500 text-center">
                                        Delete
                                    </th>
                                </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100 text-xs">
                                {isLoadingDevices ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="p-8 text-center text-gray-500"
                                        >
                                            Loading devices...
                                        </td>
                                    </tr>
                                ) : devices.length > 0 ? (
                                    devices.map((device) => (
                                        <tr
                                            key={device.id}
                                            className="hover:bg-gray-50/70 transition-colors"
                                        >
                                            <td className="p-3.5 font-bold text-gray-900">
                                                {device.title}
                                            </td>

                                            <td className="p-3.5 text-gray-600">
                                                {device.manufacturer}
                                            </td>

                                            <td className="p-3.5 font-mono text-gray-600">
                                                {device.model}
                                            </td>

                                            <td className="p-3.5 font-mono text-gray-600">
                                                {device.ipAddress}
                                            </td>

                                            <td className="p-3.5 font-mono text-gray-600">
                                                {device.sshPort}
                                            </td>

                                            <td className="p-3.5 text-gray-700 font-mono">
                                                {device.username}
                                            </td>

                                            <td className="p-3.5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        device.id &&
                                                        handleDeleteDevice(device.id)
                                                    }
                                                    className="p-1.5 text-gray-400 hover:text-custom-dark-red rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Delete Device"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="p-8 text-center text-gray-400"
                                        >
                                            No devices present in database.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
                                <p className="text-xs text-gray-500">
                                    Page {currentPage + 1} of {totalPages}
                                    {totalElements > 0 && (
                                        <span> · {totalElements} devices</span>
                                    )}
                                </p>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={handlePreviousPage}
                                        disabled={currentPage === 0 || isLoadingDevices}
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>

                                    {Array.from(
                                        { length: totalPages },
                                        (_, pageIndex) => pageIndex
                                    ).map((pageIndex) => (
                                        <button
                                            key={pageIndex}
                                            type="button"
                                            onClick={() => handlePageChange(pageIndex)}
                                            disabled={isLoadingDevices}
                                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                                                currentPage === pageIndex
                                                    ? "bg-black text-white"
                                                    : "border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {pageIndex + 1}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={handleNextPage}
                                        disabled={
                                            currentPage >= totalPages - 1 ||
                                            isLoadingDevices
                                        }
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};