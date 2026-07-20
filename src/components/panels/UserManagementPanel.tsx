import {useCallback, useEffect, useState} from "react";
import {ROLE_TO_ID_MAP, type RoleOption, type User} from "@/schemas/users.ts";
import {createUser, getUsers} from "@/api/users.ts";
import * as React from "react";
import {getCookie} from "@/utils/cookies.ts";
import {toast} from "sonner";

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

    // 1. Wrap the bulk fetch logic in useCallback to prevent infinite render loops in useEffect
    const handleFetchAll = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to retrieve directory records.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 2. TRIGGER ON MOUNT: Automatically load all users when the component opens
    useEffect(() => {
        // Only fetch if the user is looking at the view/directory tab
        if (activeSubView === "view") {
            handleFetchAll();
        }
    }, [activeSubView, handleFetchAll]);

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

            // Auto-pivot to refresh database layout view
            setActiveSubView("view");
        } catch (err: any) {
            toast.error(err.message || "Identity provision rejected.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Control Console Header Block */}
            <div className="border-b border-gray-100 pb-4">
                <h3 className="text-2xl font-black text-black tracking-tight">User Operations Console</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Synchronized administrative terminal to provision identities, modify properties, and manage security claims.
                </p>
            </div>

            {/* Sub-Tabs Navigation Segment */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">
                <button onClick={() => setActiveSubView("view")} className={`pb-3 px-2 text-sm font-medium transition-all ${activeSubView === "view" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-black"}`}>
                    Directory & Search
                </button>
                <button onClick={() => setActiveSubView("create")} className={`pb-3 px-2 text-sm font-medium transition-all ${activeSubView === "create" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-black"}`}>
                    Provision User
                </button>
                <button onClick={() => setActiveSubView("modify")} className={`pb-3 px-2 text-sm font-medium transition-all ${activeSubView === "modify" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-black"}`}>
                    Modify Identity
                </button>
                <button onClick={() => setActiveSubView("delete")} className={`pb-3 px-2 text-sm font-medium transition-all ${activeSubView === "delete" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-black"}`}>
                    De-provisioning
                </button>
            </div>

            {/* System Error Notification Toast Bar */}
            {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
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
                                    placeholder="Enter standard 36-character canonical UUID..."
                                    value={uuidQuery}
                                    onChange={(e) => setUuidQuery(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black placeholder-gray-400 transition-colors"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || !uuidQuery.trim()}
                                className="w-full sm:w-auto px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0 h-9.5"
                            >
                                Search Identity
                            </button>
                        </form>

                        {/* Sync Directory Actions */}
                        <div className="flex items-end w-full">
                            <button
                                type="button"
                                onClick={handleFetchAll}
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
                            user.role === "ADMIN" ? "bg-red-50 border-red-200 text-red-700" :
                                user.role === "NETWORK_ENGINEER" ? "bg-blue-50 border-blue-200 text-blue-700" :
                                    "bg-gray-50 border-gray-200 text-gray-700"
                        }`}>
                          {user.role}
                        </span>
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
                    </div>
                </div>
            )}

            {/* VIEW 2: Provision Identity Submission Request View */}
            {activeSubView === "create" && (
                <form onSubmit={handleCreateUserSubmit} className="max-w-2xl bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h4 className="text-base font-bold text-black border-b pb-2 border-gray-100">Provision a New Operator Account</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm text-black focus:outline-none focus:border-black"
                            />
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
                                    <div className={hasMinLength ? "text-green-600" : "text-gray-400"}>{hasMinLength ? "✓" : "○"} Minimum 8 characters</div>
                                    <div className={hasUppercase ? "text-green-600" : "text-gray-400"}>{hasUppercase ? "✓" : "○"} At least one uppercase letter (A-Z)</div>
                                    <div className={hasLowercase ? "text-green-600" : "text-gray-400"}>{hasLowercase ? "✓" : "○"} At least one lowercase letter (a-z)</div>
                                    <div className={hasNumber ? "text-green-600" : "text-gray-400"}>{hasNumber ? "✓" : "○"} At least one numerical digit (0-9)</div>
                                    <div className={hasSpecial ? "text-green-600" : "text-gray-400"}>{hasSpecial ? "✓" : "○"} Special character (!@#$%^&+=)</div>
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
                                <span className="text-xs font-medium text-red-600 mt-1 block">✕ Passwords do not match</span>
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
                            disabled={isSubmitting || !isPasswordValid || password !== confirmPassword}
                            className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Processing Request..." : "Commit & Register User"}
                        </button>
                    </div>
                </form>
            )}

                {/* MODIFY USER SUB-TAB */}
                {activeSubView === "modify" && (
                    <form onSubmit={(e) => e.preventDefault()} className="max-w-2xl bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4 animate-fadeIn">
                        <h4 className="text-base font-bold text-black border-b pb-2 border-gray-100">Update Existing Identity Properties</h4>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Account UUID</label>
                            <input type="text" placeholder="Select or type the target account system ID..." className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-mono text-black focus:outline-none focus:border-black" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-lg border border-dashed border-gray-200">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">New Username (Optional)</label>
                                <input type="text" className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-black focus:outline-none focus:border-black" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Override Role Claim</label>
                                <select className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-black focus:outline-none focus:border-black">
                                    <option value="">Keep Existing Role</option>
                                    <option value="VIEWER">VIEWER</option>
                                    <option value="NETWORK_ENGINEER">NETWORK_ENGINEER</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                            <button type="submit" className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                                Save Mutation Changes
                            </button>
                        </div>
                    </form>
                )}

                {/* DELETE USER SUB-TAB */}
                {activeSubView === "delete" && (
                    <div className="max-w-2xl bg-white border border-red-200 rounded-xl p-6 shadow-sm space-y-4 animate-fadeIn">
                        <div className="flex items-start gap-3">
                            <div>
                                <h4 className="text-base font-bold text-red-900">Soft-De-provision Target Node</h4>
                                <p className="text-xs text-red-700/80 mt-0.5">
                                    Soft deleting removes active token claims and locks SSH interface connectivity, flags the user as inactive in the database, but retains records for audits.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div>
                                <label className="block text-xs font-bold text-red-800/80 uppercase mb-1">Target Account System UUID</label>
                                <input type="text" placeholder="Enter target account UUID..." className="w-full bg-white border border-red-200 rounded-lg p-2 text-sm font-mono text-black focus:outline-none focus:border-red-500 placeholder-red-200" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setActiveSubView("view")}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                                    Revoke & Soft Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}