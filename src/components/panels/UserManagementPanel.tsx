import {useCallback, useEffect, useState} from "react";
import {
    type DeleteUserPayload, deleteUserSchema,
    ROLE_TO_ID_MAP,
    type RoleOption,
    type UpdateUserPayload,
    updateUserSchema,
    type User
} from "@/schemas/users.ts";
import {createUser, deleteUser, getUsersPaginated, updateUser} from "@/api/users.ts";
import * as React from "react";
import {getCookie} from "@/utils/cookies.ts";
import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {ArrowLeftToLine, ArrowRightToLine, DatabaseSearch, UserPlus, UserRoundPen, UserRoundX} from "lucide-react";

export default function UserManagementPanel() {

    const [activeSubView, setActiveSubView] = useState<"view" | "create" | "modify" | "delete">("view");

    // --- Directory & Search View State ---
    const [users, setUsers] = useState<User[]>([]);
    const [uuidQuery, setUuidQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // --- Provision User Form State ---
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [roleSelection, setRoleSelection] = useState<RoleOption>("VIEWER");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Password Strength Dynamic Regex Valuations ---
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&+=]/.test(password);
    const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUsernameValid = username.trim().length >= 2 && username.trim().length <= 20;
    const isFormValid = isUsernameValid && isPasswordValid && password === confirmPassword;

    const {
        register: registerUpdate,
        handleSubmit: handleSubmitUpdate,
        reset: resetUpdate,
        formState: {
            errors: updateErrors,
            isSubmitting: isUpdating,
        },
    } = useForm<UpdateUserPayload>({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            role: null,
        },
    });

    const {
        register: registerDelete,
        handleSubmit: handleSubmitDelete,
        reset: resetDelete,
        watch,
        formState: {
            errors: deleteErrors,
            isSubmitting: isDeleting,
        },
    } = useForm<DeleteUserPayload>({
        resolver: zodResolver(deleteUserSchema),
    });

    const handleEditUser = (uuid: string) => {
        resetUpdate({
            uuid,
            username: "",
            role: null,
        });

        setActiveSubView("modify");
    };

    const handleDeleteUser = (uuid: string) => {
        resetDelete({
            uuid,
        });

        setActiveSubView("delete");
    };

    const uuid = watch("uuid") ?? "";

    const handleFetchAllPaginated = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            // Backend defaults size to 5, but we explicitly pass it
            const data = await getUsersPaginated(currentPage, 5, "username,asc");

            setUsers(data.content);         // Extract the 5 records
            setTotalPages(data.totalPages); // Store page count
            setTotalElements(data.totalElements);
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to retrieve directory records.");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage]);

    // 2. TRIGGER ON MOUNT: Automatically load all users when the component opens
    useEffect(() => {
        // Only fetch if the user is looking at the view/directory tab
        if (activeSubView === "view") {
            handleFetchAllPaginated();
        }
    }, [activeSubView, handleFetchAllPaginated]);

    // Action: Single user target search
    const handleFetchSingle = async (e: React.SubmitEvent) => {
        e.preventDefault();
        if (!uuidQuery.trim()) return;

        setIsLoading(true);
        setErrorMessage(null);
        try {
            const token = getCookie("token");
            const cleanUuid = uuidQuery.trim().toLowerCase();
            const res = await fetch(`http://localhost:8080/api/v1/users/${cleanUuid}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error("User identifier not found in directory.");

            const data = await res.json();
            setUsers([data]);
        } catch (err: any) {
            setErrorMessage(err.message || "Lookup failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUserSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        if (!isPasswordValid || password !== confirmPassword) return;

        setIsSubmitting(true);
        try {

            const numericRoleId = ROLE_TO_ID_MAP[roleSelection];

            await createUser({
                username,
                password,
                roleId: numericRoleId,
            });

            toast.success(`Identity "${username}" successfully provisioned.`);

            // Reset variables upon success
            setUsername("");
            setPassword("");
            setConfirmPassword("");
            setRoleSelection("VIEWER");

        } catch (err: any) {
            toast.error(err.message || "Identity provision rejected.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onUpdateUser = async (data: UpdateUserPayload) => {
        try {
            await updateUser(data);

            toast.success("User updated successfully.");

            resetUpdate();

            await handleFetchAllPaginated();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to update user."
            );
        }
    };

    const onDeleteUser = async (data: DeleteUserPayload) => {

        const confirmed = window.confirm(
            "Are you sure you want to soft delete this user?\n\n" +
            "The account will be marked as inactive and access will be revoked, " +
            "but the record will be retained for audit purposes."
        );

        if (!confirmed) {
            return;
        }

        try {

            await deleteUser(data);

            toast.success("User soft deleted successfully.");

            resetDelete();

            await handleFetchAllPaginated();

            setActiveSubView("view");

        } catch (error) {

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Soft delete failed."
            );
        }
    };

    return (
        <div className="space-y-6">
            {/* Control Console Header Block */}
            <div className="border-b border-gray-100 pb-4">
                <h3 className="text-2xl font-black text-black tracking-tight">User Operations Console</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Synchronized administrative terminal to create users, modify users, and manage authorization.
                </p>
            </div>

            {/* Sub-Tabs Navigation Segment */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">
                <button onClick={() => setActiveSubView("view")} className={`pb-3 px-2 text-sm font-medium transition-all ${activeSubView === "view" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-black"}`}>
                    <DatabaseSearch className="h-4 w-4"/>Directory & Search
                </button>
                <button onClick={() => setActiveSubView("create")} className={`pb-3 px-2 text-sm font-medium transition-all ${activeSubView === "create" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-black"}`}>
                    <UserPlus className="h-4 w-4"/>Create User
                </button>
                <button onClick={() => setActiveSubView("modify")} className={`pb-3 px-2 text-sm font-medium transition-all ${activeSubView === "modify" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-black"}`}>
                    <UserRoundPen className="h-4 w-4"/>Modify User
                </button>
                <button onClick={() => setActiveSubView("delete")} className={`pb-3 px-2 text-sm font-medium transition-all ${activeSubView === "delete" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-black"}`}>
                    <UserRoundX className="h-4 w-4"/>Soft Delete User
                </button>
            </div>

            {/* System Error Notification Toast Bar */}
            {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-custom-dark-red font-medium">
                    {errorMessage}
                </div>
            )}

            {/* --- SUBVIEW RENDER GRID --- */}

            {/* VIEW 1: Directory Routing Index View */}
            {activeSubView === "view" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        {/* Search Endpoint Form */}
                        <form onSubmit={handleFetchSingle} className="lg:col-span-2 flex flex-col sm:flex-row gap-2 items-end w-full">
                            <div className="grow w-full">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Query System Directory by Identifier
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter target account UUID..."
                                    value={uuidQuery}
                                    onChange={(e) => setUuidQuery(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black placeholder-gray-400 transition-colors"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || !UUID_REGEX.test(uuidQuery.trim())}
                                className="w-full sm:w-auto px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0 h-9.5"
                            >
                                Search Identity
                            </button>
                        </form>

                        {/* Sync Directory Actions */}
                        <div className="flex items-end w-full">
                            <button
                                type="button"
                                onClick={handleFetchAllPaginated}
                                disabled={isLoading}
                                className="w-full px-5 py-2 bg-white border border-gray-300 text-black text-sm font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50 h-9.5"
                            >
                                Sync Directory
                            </button>
                        </div>
                    </div>

                    {/* Database Content Table Frame */}
                    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">System UUID</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Identity Name</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Assigned Claim</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Edit</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Delete</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                            {isLoading ? (
                                [1, 2, 3].map((n) => (
                                    <tr key={n} className="animate-pulse">
                                        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
                                        <td className="p-4"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                                        <td className="p-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                                    </tr>
                                ))
                            ) : users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.uuid} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="p-4 font-mono text-xs text-gray-400 select-all">{user.uuid}</td>
                                        <td className="p-4 font-semibold text-black">{user.username}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide border ${
                                                user.role === "ADMIN" ? "bg-red-50 border-red-200 text-custom-dark-red" :
                                                    user.role === "NETWORK_ENGINEER" ? "bg-blue-50 border-blue-200 text-blue-700" :
                                                        "bg-gray-50 border-gray-200 text-gray-700"
                                            }`}>
                                              {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleEditUser(user.uuid)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                                            >
                                                <UserRoundPen />
                                            </button>
                                        </td>

                                        {/* NEW DELETE COLUMN */}
                                        <td className="p-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteUser(user.uuid)}
                                                className="px-3 py-1 bg-custom-dark-red text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                                            >
                                                <UserRoundX />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-sm text-gray-400">
                                        No identities found in the system registry layout.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 rounded-b-xl">
                            <div className="text-xs text-gray-500 font-medium">
                                Showing page <span className="font-bold text-black">{currentPage + 1}</span> of{" "}
                                <span className="font-bold text-black">{totalPages || 1}</span> ({totalElements} total entries)
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                                    disabled={currentPage === 0 || isLoading}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-black hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ArrowLeftToLine />Previous
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((prev) => prev + 1)}
                                    disabled={currentPage + 1 >= totalPages || isLoading}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-black hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ArrowRightToLine />Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 2: Provision Identity Submission Request View */}
            {activeSubView === "create" && (
                <form onSubmit={handleCreateUserSubmit} className="max-w-2xl bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h4 className="text-base font-bold text-black border-b pb-2 border-gray-100">Provision a New Operator Account</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Username Input Block with Validation */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="2–20 characters"
                                required
                                className={`w-full bg-white border rounded-lg p-2 text-sm text-black focus:outline-none transition-colors ${
                                    username === ""
                                        ? "border-gray-300 focus:border-black"
                                        : isUsernameValid
                                            ? "border-green-500 focus:border-green-600 bg-green-50/20"
                                            : "border-amber-400 focus:border-amber-500 bg-amber-50/20"
                                }`}
                            />

                            {/* Username Inline Feedback */}
                            {username.length > 0 && !isUsernameValid && (
                                <span className="text-xs font-medium text-amber-600 mt-1 block">
                                    Must be between 2 and 20 characters ({username.trim().length}/20)
                                </span>
                                        )}
                                        {username.length > 0 && isUsernameValid && (
                                            <span className="text-xs font-medium text-green-600 mt-1 block">
                                    Valid username length
                                </span>
                            )}
                        </div>

                        {/* Input Password Credentials Block */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password Credentials</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className={`w-full bg-white border rounded-lg p-2 text-sm text-black focus:outline-none transition-colors ${
                                    password === "" ? "border-gray-300 focus:border-black" : isPasswordValid ? "border-green-500" : "border-amber-400"
                                }`}
                            />

                            {/* Dynamic Checklist Component Grid */}
                            {password.length > 0 && !isPasswordValid && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1">
                                    <p className="font-bold text-gray-500 uppercase tracking-wider mb-1.5">Security Compliance:</p>
                                    <div className={hasMinLength ? "text-green-600" : "text-gray-400"}> Minimum 8 characters</div>
                                    <div className={hasUppercase ? "text-green-600" : "text-gray-400"}> At least one uppercase letter (A-Z)</div>
                                    <div className={hasLowercase ? "text-green-600" : "text-gray-400"}> At least one lowercase letter (a-z)</div>
                                    <div className={hasNumber ? "text-green-600" : "text-gray-400"}> At least one numerical digit (0-9)</div>
                                    <div className={hasSpecial ? "text-green-600" : "text-gray-400"}> Special character (!@#$%^&+=)</div>
                                </div>
                            )}
                        </div>

                        {/* Input Password Matching Block Check */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className={`w-full bg-white border rounded-lg p-2 text-sm text-black focus:outline-none transition-colors ${
                                    confirmPassword === ""
                                        ? "border-gray-300 focus:border-black"
                                        : password === confirmPassword
                                            ? "border-green-500 focus:border-green-600 bg-green-50/20"
                                            : "border-red-500 focus:border-red-600 bg-red-50/20"
                                }`}
                            />
                            {confirmPassword && password !== confirmPassword && (
                                <span className="text-xs font-medium text-custom-dark-red mt-1 block">✕ Passwords do not match</span>
                            )}
                            {confirmPassword && password === confirmPassword && (
                                <span className="text-xs font-medium text-green-600 mt-1 block">✓ Passwords match</span>
                            )}
                        </div>

                        {/* Selection Dropdown matching direct backend Enum Values */}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">RBAC Security Claim</label>
                            <select
                                value={roleSelection}
                                onChange={(e) => setRoleSelection(e.target.value as RoleOption)}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm text-black focus:outline-none focus:border-black"
                            >
                                <option value="VIEWER">VIEWER</option>
                                <option value="NETWORK_ENGINEER">NETWORK_ENGINEER</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting || !isFormValid}
                            className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Processing Request..." : "Commit & Register User"}
                        </button>
                    </div>
                </form>
            )}

            {/* MODIFY USER SUB-TAB */}
            {activeSubView === "modify" && (
                <form
                    onSubmit={handleSubmitUpdate(onUpdateUser)}
                    className="max-w-2xl bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4 animate-fadeIn"
                >
                    <h4 className="text-base font-bold text-black border-b pb-2 border-gray-100">
                        Update Existing Identity Properties
                    </h4>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Target Account UUID
                        </label>

                        <input
                            type="text"
                            placeholder="Enter target account UUID..."
                            {...registerUpdate("uuid")}
                            className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-mono text-black focus:outline-none focus:border-black"
                        />

                        {updateErrors.uuid && (
                            <p className="text-custom-dark-red text-sm mt-1">
                                {updateErrors.uuid.message}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-lg border border-dashed border-gray-200">

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                                New Username
                            </label>

                            <input
                                type="text"
                                {...registerUpdate("username")}
                                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-black focus:outline-none focus:border-black"
                            />

                            {updateErrors.username && (
                                <p className="text-custom-dark-red text-sm mt-1">
                                    {updateErrors.username.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                                Override Role Claim
                            </label>

                            <select
                                {...registerUpdate("role", {
                                    setValueAs: (value) =>
                                        value === "" ? null : value,
                                })}
                                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-black focus:outline-none focus:border-black"
                            >
                                <option value="">
                                    Keep Existing Role
                                </option>

                                <option value="VIEWER">
                                    VIEWER
                                </option>

                                <option value="NETWORK_ENGINEER">
                                    NETWORK_ENGINEER
                                </option>

                                <option value="ADMIN">
                                    ADMIN
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {isUpdating
                                ? "Updating..."
                                : "Save Mutation Changes"}
                        </button>
                    </div>
                </form>
            )}
            {/* DELETE USER SUB-TAB */}
            {activeSubView === "delete" && (
                <form
                    onSubmit={handleSubmitDelete(onDeleteUser)}
                    className="max-w-2xl bg-white border border-red-200 rounded-xl p-6 shadow-sm space-y-4 animate-fadeIn"
                >
                    <div className="flex items-start gap-3">
                        <div>
                            <h4 className="text-base font-bold text-custom-dark-red">
                                Soft-De-provision Target Node
                            </h4>

                            <p className="text-xs text-red-700/80 mt-0.5">
                                Soft deleting removes active token claims and locks SSH
                                interface connectivity, flags the user as inactive in the
                                database, but retains records for audits.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">

                        <div>

                            <label className="block text-xs font-bold text-red-800/80 uppercase mb-1">
                                Target Account System UUID
                            </label>

                            <input
                                type="text"
                                placeholder="Enter target account UUID..."
                                {...registerDelete("uuid")}
                                className="w-full bg-white border border-red-200 rounded-lg p-2 text-sm font-mono text-black focus:outline-none focus:border-red-500 placeholder-red-200"
                            />

                            {deleteErrors.uuid && (
                                <p className="text-custom-dark-red text-sm mt-1">
                                    {deleteErrors.uuid.message}
                                </p>
                            )}

                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isDeleting || !UUID_REGEX.test(uuid.trim())}
                                className="px-5 py-2 bg-custom-dark-red text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0 h-9.5"
                            >
                                {isDeleting
                                    ? "Deleting..."
                                    : "Revoke & Soft Delete"}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}