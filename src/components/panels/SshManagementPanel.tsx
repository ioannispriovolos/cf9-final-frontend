import { useEffect, useState } from "react";
import {type SubmitHandler, useForm} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Terminal,
    Server,
    Play,
    Plus,
    CheckSquare,
    Square,
    Trash2,
    Cpu,
    ShieldCheck,
    Check, Pencil, X
} from "lucide-react";
import { toast } from "sonner";
import {
    getDevices,
    createDevice,
    deleteDevice,
    executeCommand, updateDevice,
} from "@/api/devices";

import {
    type Device,
    type CreateDevicePayload,
    createDeviceSchema, type CreateDeviceFormInput, type UpdateDeviceFormInput, type UpdateDeviceFormValues,
    updateDeviceFormSchema, type UpdateDevicePayload,
} from "@/schemas/devices";
import * as React from "react";

/**
 * Optional callback contract for notifying the parent dashboard that
 * device-related data has changed.
 *
 * The callback may be synchronous or asynchronous. It is used
 * to refresh shared dashboard metrics after a device is created, updated,
 * or soft-deleted.
 */
type SshManagementPanelProps = {
    onDeviceChanged?: () => void | Promise<void>;
};

/**
 * Builds a partial device update payload by comparing the original device
 * with the values currently entered in the edit form.
 *
 * Only modified properties are included as concrete values. Properties that
 * have not changed are represented by `null`, allowing the backend to retain
 * their existing values.
 *
 * Device passwords are intentionally excluded because this update workflow
 * does not allow password modification.
 *
 * @param original - The original device values loaded from the backend.
 * @param edited - The validated values currently entered in the edit form.
 *
 * @returns An `UpdateDevicePayload` containing changed values and `null`
 * for fields that were not modified.
 */
function buildUpdateDevicePayload(
    original: Device,
    edited: UpdateDeviceFormValues
): UpdateDevicePayload {
    return {
        title:
            edited.title !== original.title
                ? edited.title
                : null,

        manufacturer:
            edited.manufacturer !==
            original.manufacturer
                ? edited.manufacturer
                : null,

        model:
            edited.model !== original.model
                ? edited.model
                : null,

        ipAddress:
            edited.ipAddress !==
            original.ipAddress
                ? edited.ipAddress
                : null,

        sshPort:
            edited.sshPort !==
            original.sshPort
                ? edited.sshPort
                : null,

        username:
            edited.username !==
            original.username
                ? edited.username
                : null,
    };
}

/**
 * Provides the device-management and SSH-execution interface.
 *
 * The component is responsible for:
 * - browsing the paginated device directory;
 * - registering new devices;
 * - editing existing device properties;
 * - soft-deleting devices;
 * - selecting devices across paginated selection views;
 * - executing SSH commands against selected devices;
 * - displaying per-device command results;
 * - notifying the parent dashboard when device data changes.
 *
 * API communication is delegated to the functions defined in `api/devices.ts`,
 * while form validation is handled through React Hook Form and the Zod schemas
 * defined in `schemas/devices.ts`.
 *
 * @param onDeviceChanged - Optional callback used to refresh shared device
 * statistics after successful device mutations.
 *
 * @returns The SSH and device-management user interface.
 */
export default function SshManagementPanel({onDeviceChanged,}: SshManagementPanelProps) {

    /**
     * Tracks which main panel is currently visible:
     * the SSH terminal or the device directory.
     */
    const [activeTab, setActiveTab] = useState<"terminal" | "devices">("terminal");

    /**
     * Number of devices requested from the backend per page.
     */
    const PAGE_SIZE = 6;

    /**
     * Stores the devices displayed in the Device Directory tab.
     */
    const [devices, setDevices] = useState<Device[]>([]);
    /**
     * Zero-based index of the currently displayed Device Directory page.
     */
    const [currentPage, setCurrentPage] = useState(0);
    /**
     * Total number of available Device Directory pages.
     */
    const [totalPages, setTotalPages] = useState(0);
    /**
     * Total number of active devices reported by the backend.
     */
    const [totalElements, setTotalElements] = useState(0);
    /**
     * Indicates whether the Device Directory is currently being retrieved.
     */
    const [isLoadingDevices, setIsLoadingDevices] = useState(false);

    /**
     * Stores the devices displayed in the paginated SSH target-selection view.
     *
     * This state is intentionally separate from `devices` so navigation in the
     * terminal selection area does not affect pagination in the Device Directory.
     */
    const [selectionDevices, setSelectionDevices] =
        useState<Device[]>([]);

    /**
     * Zero-based page index for the SSH target-selection device list.
     */
    const [selectionCurrentPage, setSelectionCurrentPage] =
        useState(0);

    /**
     * Total number of pages available in the SSH target-selection list.
     */

    const [selectionTotalPages, setSelectionTotalPages] =
        useState(0);

    /**
     * Total number of active devices available for SSH target selection.
     */
    const [selectionTotalElements, setSelectionTotalElements] =
        useState(0);

    /**
     * Indicates whether the SSH target-selection page is currently loading.
     */
    const [isLoadingSelectionDevices, setIsLoadingSelectionDevices] =
        useState(false);

    /**
     * Stores the ID of the device row currently being edited.
     *
     * A null value indicates that no device is currently in edit mode.
     */
    const [
        editingDeviceId,
        setEditingDeviceId,
    ] = useState<number | null>(null);

    /**
     * Stores the original values of the device currently being edited.
     *
     * These values are used to determine which properties actually changed
     * before constructing the partial update request.
     */
    const [
        originalDevice,
        setOriginalDevice,
    ] = useState<Device | null>(null);

    /**
     * Stores the IDs of all devices currently selected for SSH execution.
     *
     * Selection is preserved when navigating between device-selection pages.
     */
    const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>([]);
    /**
     * Stores the SSH command currently entered by the user.
     */
    const [command, setCommand] = useState("");
    /**
     * Stores the formatted text displayed in the SSH terminal output panel.
     */
    const [terminalOutput, setTerminalOutput] = useState(
        `SSH Management Engine Initialized.
Select target devices from directory.
------------------------------------------------------------`
    );
    /**
     * Indicates whether an SSH command is currently being executed.
     */
    const [isExecuting, setIsExecuting] = useState(false);

    /**
     * Configures the create-device form.
     *
     * React Hook Form manages input state and submission, while Zod validates
     * device properties such as title, manufacturer, IPv4 address, SSH port,
     * username, and password before the request is sent.
     */
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

    /**
     * Configures the inline device-update form.
     *
     * The form is populated with the selected row's current device properties.
     * Password modification is intentionally excluded from this update workflow.
     */
    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        reset: resetEdit,
        formState: {
            errors: editErrors,
            isSubmitting: isUpdating,
        },
    } = useForm<
        UpdateDeviceFormInput,
        unknown,
        UpdateDeviceFormValues
    >({
        resolver: zodResolver(
            updateDeviceFormSchema
        ),
    });

    /**
     * Places a device row into edit mode.
     *
     * The original device is stored for later comparison, and the edit form is
     * populated with the device's current values.
     *
     * @param device - The device selected for editing.
     */
    const handleStartEdit = (
        device: Device
    ) => {
        setEditingDeviceId(device.id);
        setOriginalDevice(device);

        resetEdit({
            title: device.title,
            manufacturer: device.manufacturer,
            model: device.model,
            ipAddress: device.ipAddress,
            sshPort: device.sshPort,
            username: device.username,
        });
    };

    /**
     * Cancels the current device-edit operation.
     *
     * The component leaves edit mode, discards the stored original device,
     * and clears the edit form state.
     */
    const handleCancelEdit = () => {
        setEditingDeviceId(null);
        setOriginalDevice(null);
        resetEdit();
    };

    /**
     * Validates and persists modifications made to the currently edited device.
     *
     * The current form values are compared with the original device so unchanged
     * fields can be represented by `null`. If no values changed, no request is sent.
     *
     * After a successful update:
     * - edit mode is closed;
     * - the Device Directory is refreshed;
     * - the SSH target-selection list is refreshed;
     * - the parent dashboard is notified when a callback is available.
     *
     * @param values - Validated device values from the inline edit form.
     */
    const handleSaveDevice:
        SubmitHandler<UpdateDeviceFormValues> =
        async (values) => {
            if (
                editingDeviceId === null ||
                originalDevice === null
            ) {
                return;
            }

            const payload =
                buildUpdateDevicePayload(
                    originalDevice,
                    values
                );

            const hasChanges =
                Object.values(payload).some(
                    (value) => value !== null
                );

            if (!hasChanges) {
                toast.info(
                    "No device properties were changed."
                );
                return;
            }

            try {
                await updateDevice(
                    editingDeviceId,
                    payload
                );

                handleCancelEdit();

                await Promise.all([
                    loadDevices(currentPage),

                    loadSelectionDevices(
                        selectionCurrentPage
                    ),

                    onDeviceChanged
                        ? Promise.resolve(
                            onDeviceChanged()
                        )
                        : Promise.resolve(),
                ]);

                toast.success(
                    "Device updated successfully."
                );
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to update device."
                );
            }
        };

    /**
     * Retrieves one paginated Device Directory page from the backend.
     *
     * The function updates the displayed device records and all associated
     * pagination metadata while maintaining a loading indicator.
     *
     * @param page - Zero-based Device Directory page index. Defaults to `0`.
     */
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

    /**
     * Reloads the Device Directory whenever the current directory page changes.
     */
    useEffect(() => {
        void loadDevices(currentPage);
    }, [currentPage]);

    /**
     * Navigates to the previous Device Directory page without going below page 0.
     */
    const handlePreviousPage = () => {
        setCurrentPage((previousPage) =>
            Math.max(previousPage - 1, 0)
        );
    };

    /**
     * Navigates to the next Device Directory page without exceeding the
     * final available page.
     */
    const handleNextPage = () => {
        setCurrentPage((previousPage) =>
            Math.min(previousPage + 1, totalPages - 1)
        );
    };

    /**
     * Navigates directly to a specific Device Directory page when the requested
     * page index is valid and differs from the current page.
     *
     * @param page - Zero-based target page index.
     */
    const handlePageChange = (page: number) => {
        if (
            page >= 0 &&
            page < totalPages &&
            page !== currentPage
        ) {
            setCurrentPage(page);
        }
    };

    /**
     * Retrieves one page of devices for the SSH target-selection interface.
     *
     * This pagination flow is independent from the Device Directory pagination,
     * allowing users to browse SSH targets without changing the directory page.
     *
     * @param page - Zero-based target-selection page index.
     */
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

    /**
     * Reloads the SSH target-selection device list whenever its page changes.
     */
    useEffect(() => {
        void loadSelectionDevices(
            selectionCurrentPage
        );
    }, [selectionCurrentPage]);

    /**
     * Extracts the IDs of all devices displayed on the current SSH
     * target-selection page.
     */
    const selectionPageDeviceIds =
        selectionDevices
            .map((device) => device.id)
            .filter(
                (id): id is number =>
                    id !== undefined
            );

    /**
     * Indicates whether every device visible on the current SSH
     * target-selection page is already selected.
     */
    const areAllCurrentPageDevicesSelected =
        selectionPageDeviceIds.length > 0 &&
        selectionPageDeviceIds.every((id) =>
            selectedDeviceIds.includes(id)
        );

    /**
     * Selects or deselects every device on the current SSH target-selection page.
     *
     * Device IDs selected on other pages are preserved, allowing command targets
     * to span multiple pages.
     */
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

    /**
     * Navigates to the previous SSH target-selection page.
     */
    const handleSelectionPreviousPage = () => {
        setSelectionCurrentPage((previousPage) =>
            Math.max(previousPage - 1, 0)
        );
    };

    /**
     * Navigates to the next SSH target-selection page.
     */
    const handleSelectionNextPage = () => {
        setSelectionCurrentPage((previousPage) =>
            Math.min(
                previousPage + 1,
                selectionTotalPages - 1
            )
        );
    };

    /**
     * Navigates directly to a specific SSH target-selection page.
     *
     * @param pageIndex - Zero-based target page index.
     */

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

    /**
     * Registers a new network device using validated create-form data.
     *
     * After successful registration, the create form is reset and both the
     * Device Directory and SSH target-selection list are refreshed. The parent
     * dashboard is also notified when `onDeviceChanged` is available.
     *
     * @param payload - Validated device creation payload.
     */
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
                loadSelectionDevices(selectionCurrentPage),
                onDeviceChanged
                    ? Promise.resolve(onDeviceChanged())
                    : Promise.resolve(),
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

    /**
     * Soft-deletes a network device and synchronizes all related UI state.
     *
     * The deleted device is removed from the current SSH selection. Pagination
     * is adjusted when deleting the final device from a non-first page.
     *
     * After deletion:
     * - the Device Directory is refreshed or moved back one page;
     * - the SSH target-selection page is refreshed or moved back one page;
     * - parent dashboard metrics are refreshed when possible.
     *
     * @param deviceId - Unique numeric identifier of the device to soft-delete.
     */
    const handleDeleteDevice = async (
        deviceId: number
    ) => {
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

            const refreshRequests: Promise<unknown>[] = [];

            if (nextDirectoryPage !== currentPage) {
                setCurrentPage(nextDirectoryPage);
            } else {
                refreshRequests.push(
                    loadDevices(currentPage)
                );
            }

            if (
                nextSelectionPage !==
                selectionCurrentPage
            ) {
                setSelectionCurrentPage(
                    nextSelectionPage
                );
            } else {
                refreshRequests.push(
                    loadSelectionDevices(
                        selectionCurrentPage
                    )
                );
            }

            if (onDeviceChanged) {
                refreshRequests.push(
                    Promise.resolve(
                        onDeviceChanged()
                    )
                );
            }

            await Promise.all(refreshRequests);

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

    /**
     * Executes the current SSH command against all selected devices.
     *
     * The function validates that a non-empty command and at least one device
     * selection exist before calling the backend SSH execution endpoint.
     *
     * Each per-device result is transformed into a human-readable terminal block
     * containing:
     * - device title;
     * - IP address;
     * - execution status;
     * - execution duration;
     * - command output or error information.
     *
     * A summary toast communicates whether all commands succeeded, all failed,
     * or the batch completed with mixed results.
     *
     * @param e - Form submission event from the SSH command form.
     */
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

    /**
     * Toggles the SSH selection state of a single device.
     *
     * If the device is already selected, it is removed. Otherwise, its ID is
     * appended to the existing selection. Selections from other pages are retained.
     *
     * @param id - Unique numeric identifier of the device to toggle.
     */
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
                        Execute batch scripts and provision network inventory.
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
                    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="w-full overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
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

                                    <th className="p-3.5 text-center text-xs font-bold uppercase text-gray-500">
                                        Actions
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
                                    devices.map((device) => {
                                        const isEditing =
                                            editingDeviceId === device.id;

                                        return (
                                            <tr
                                                key={device.id}
                                                className={
                                                    isEditing
                                                        ? "bg-blue-50/40"
                                                        : "transition-colors hover:bg-gray-50/70"
                                                }
                                            >
                                                {/* Title */}
                                                <td className="p-3.5 align-top">
                                                    {isEditing ? (
                                                        <>
                                                            <input
                                                                type="text"
                                                                {...registerEdit(
                                                                    "title"
                                                                )}
                                                                className="w-full min-w-32 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-black focus:border-blue-500 focus:outline-none"
                                                            />

                                                            {editErrors.title?.message && (
                                                                <p className="mt-1 text-[10px] text-custom-dark-red">
                                                                    {
                                                                        editErrors.title
                                                                            .message
                                                                    }
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="font-bold text-gray-900">
                                            {device.title}
                                        </span>
                                                    )}
                                                </td>

                                                {/* Manufacturer */}
                                                <td className="p-3.5 align-top">
                                                    {isEditing ? (
                                                        <>
                                                            <input
                                                                type="text"
                                                                {...registerEdit(
                                                                    "manufacturer"
                                                                )}
                                                                className="w-full min-w-32 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-black focus:border-blue-500 focus:outline-none"
                                                            />

                                                            {editErrors.manufacturer
                                                                ?.message && (
                                                                <p className="mt-1 text-[10px] text-custom-dark-red">
                                                                    {
                                                                        editErrors
                                                                            .manufacturer
                                                                            .message
                                                                    }
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-600">
                                            {device.manufacturer}
                                        </span>
                                                    )}
                                                </td>

                                                {/* Model */}
                                                <td className="p-3.5 align-top">
                                                    {isEditing ? (
                                                        <>
                                                            <input
                                                                type="text"
                                                                {...registerEdit(
                                                                    "model"
                                                                )}
                                                                className="w-full min-w-32 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-black focus:border-blue-500 focus:outline-none"
                                                            />

                                                            {editErrors.model?.message && (
                                                                <p className="mt-1 text-[10px] text-custom-dark-red">
                                                                    {
                                                                        editErrors.model
                                                                            .message
                                                                    }
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="font-mono text-gray-600">
                                            {device.model}
                                        </span>
                                                    )}
                                                </td>

                                                {/* IP Address */}
                                                <td className="p-3.5 align-top">
                                                    {isEditing ? (
                                                        <>
                                                            <input
                                                                type="text"
                                                                {...registerEdit(
                                                                    "ipAddress"
                                                                )}
                                                                className="w-full min-w-36 rounded-md border border-gray-300 bg-white px-2 py-1.5 font-mono text-xs text-black focus:border-blue-500 focus:outline-none"
                                                            />

                                                            {editErrors.ipAddress
                                                                ?.message && (
                                                                <p className="mt-1 text-[10px] text-custom-dark-red">
                                                                    {
                                                                        editErrors
                                                                            .ipAddress
                                                                            .message
                                                                    }
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="font-mono text-gray-600">
                                            {device.ipAddress}
                                        </span>
                                                    )}
                                                </td>

                                                {/* SSH Port */}
                                                <td className="p-3.5 align-top">
                                                    {isEditing ? (
                                                        <>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={65535}
                                                                {...registerEdit(
                                                                    "sshPort"
                                                                )}
                                                                className="w-full min-w-20 rounded-md border border-gray-300 bg-white px-2 py-1.5 font-mono text-xs text-black focus:border-blue-500 focus:outline-none"
                                                            />

                                                            {editErrors.sshPort
                                                                ?.message && (
                                                                <p className="mt-1 text-[10px] text-custom-dark-red">
                                                                    {
                                                                        editErrors
                                                                            .sshPort
                                                                            .message
                                                                    }
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="font-mono text-gray-600">
                                            {device.sshPort}
                                        </span>
                                                    )}
                                                </td>

                                                {/* Username */}
                                                <td className="p-3.5 align-top">
                                                    {isEditing ? (
                                                        <>
                                                            <input
                                                                type="text"
                                                                {...registerEdit(
                                                                    "username"
                                                                )}
                                                                className="w-full min-w-28 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-black focus:border-blue-500 focus:outline-none"
                                                            />

                                                            {editErrors.username
                                                                ?.message && (
                                                                <p className="mt-1 text-[10px] text-custom-dark-red">
                                                                    {
                                                                        editErrors
                                                                            .username
                                                                            .message
                                                                    }
                                                                </p>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="font-mono text-gray-700">
                                            {device.username}
                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="p-3.5 align-top">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {isEditing ? (
                                                            <>
                                                                {/* Save */}
                                                                <button
                                                                    type="button"
                                                                    onClick={handleSubmitEdit(
                                                                        handleSaveDevice
                                                                    )}
                                                                    disabled={isUpdating}
                                                                    className="rounded-lg p-1.5 text-green-700 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    title="Save Changes"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </button>

                                                                {/* Cancel */}
                                                                <button
                                                                    type="button"
                                                                    onClick={
                                                                        handleCancelEdit
                                                                    }
                                                                    disabled={isUpdating}
                                                                    className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    title="Cancel Editing"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>

                                                                {/* Disabled delete */}
                                                                <button
                                                                    type="button"
                                                                    disabled
                                                                    className="cursor-not-allowed rounded-lg p-1.5 text-gray-300"
                                                                    title="Delete is disabled while editing"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {/* Edit */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleStartEdit(
                                                                            device
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        editingDeviceId !==
                                                                        null
                                                                    }
                                                                    className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-gray-300"
                                                                    title="Edit Device"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </button>

                                                                {/* Delete */}
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        editingDeviceId !==
                                                                        null
                                                                    }
                                                                    onClick={() => {
                                                                        const confirmed =
                                                                            window.confirm(
                                                                                `Are you sure you want to delete the device "${device.title}"?\n\nThe record will be soft deleted.`
                                                                            );

                                                                        if (
                                                                            confirmed
                                                                        ) {
                                                                            void handleDeleteDevice(
                                                                                device.id
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-custom-dark-red disabled:cursor-not-allowed disabled:text-gray-300"
                                                                    title="Delete Device"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
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
                            <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row">
                                <p className="text-xs text-gray-500">
                                    Page {currentPage + 1} of {totalPages}
                                    {totalElements > 0 && (
                                        <span>
                        {" "}
                                            · {totalElements} devices
                    </span>
                                    )}
                                </p>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={handlePreviousPage}
                                        disabled={
                                            currentPage === 0 ||
                                            isLoadingDevices ||
                                            editingDeviceId !== null
                                        }
                                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                                            onClick={() =>
                                                handlePageChange(pageIndex)
                                            }
                                            disabled={
                                                isLoadingDevices ||
                                                editingDeviceId !== null
                                            }
                                            className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                                                currentPage === pageIndex
                                                    ? "bg-black text-white"
                                                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                                            } disabled:cursor-not-allowed disabled:opacity-50`}
                                        >
                                            {pageIndex + 1}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={handleNextPage}
                                        disabled={
                                            currentPage >= totalPages - 1 ||
                                            isLoadingDevices ||
                                            editingDeviceId !== null
                                        }
                                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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