import { useState } from "react";

export default function UserManagementPanel() {
    // Sub-navigation state to swap between actions cleanly
    const [activeSubView, setActiveSubView] = useState<"view" | "create" | "modify" | "delete">("view");

    // Dummy query state for fetching a specific user by UUID
    const [uuidQuery, setUuidQuery] = useState("");

    // Mock data representing database records from your Java Spring Boot backend
    const mockUsers = [
        { uuid: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", username: "admin_root", email: "admin@cf9.com", role: "ADMIN", status: "Active" },
        { uuid: "f7e6d5c4-b3a2-1b0c-9d8e-7f6e5d4c3b2a", username: "net_eng_alex", email: "alex@cf9.com", role: "NETWORK_ENGINEER", status: "Active" },
        { uuid: "bc123456-7890-abcd-ef12-34567890abcd", username: "viewer_guest", email: "guest@cf9.com", role: "VIEWER", status: "Active" },
    ];

    return (
        <div className="space-y-6">
            {/* Top Header Meta Info */}
            <div className="border-b border-gray-100 pb-4">
                <h3 className="text-2xl font-black text-black tracking-tight">User Operations Console</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Synchronized administrative terminal to provision identities, modify properties, and manage security claims.
                </p>
            </div>

            {/* Sub-Tabs Action Center Selector */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">
                <button
                    onClick={() => setActiveSubView("view")}
                    className={`pb-3 px-2 text-sm font-medium transition-all ${
                        activeSubView === "view" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-black"
                    }`}
                >
                    Search
                </button>
                <button
                    onClick={() => setActiveSubView("create")}
                    className={`pb-3 px-2 text-sm font-medium transition-all ${
                        activeSubView === "create" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-black"
                    }`}
                >
                    Provision User
                </button>
                <button
                    onClick={() => setActiveSubView("modify")}
                    className={`pb-3 px-2 text-sm font-medium transition-all ${
                        activeSubView === "modify" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-black"
                    }`}
                >
                    Modify Identity
                </button>
                <button
                    onClick={() => setActiveSubView("delete")}
                    className={`pb-3 px-2 text-sm font-medium transition-all ${
                        activeSubView === "delete" ? "border-b-2 border-black text-black" : "text-gray-400 hover:text-black"
                    }`}
                >
                    De-provisioning
                </button>
            </div>

            {/* Dynamic Sub-View Render Area */}
            <div className="mt-4 transition-all duration-200">

                {/* VIEW & SEARCH SUB-TAB */}
                {activeSubView === "view" && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* UUID Real-Time Fetch Bar */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-3 items-end md:items-center">
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
                            <button className="w-full md:w-auto px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shrink-0">
                                Execute Fetch
                            </button>
                        </div>

                        {/* Main Responsive Directory Table */}
                        <div className="w-full overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">System UUID</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Identity Name</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Email Address</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Assigned Claim</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                {mockUsers.map((user) => (
                                    <tr key={user.uuid} className="hover:bg-gray-50/70 transition-colors">
                                        <td className="p-4 font-mono text-xs text-gray-400 select-all">{user.uuid}</td>
                                        <td className="p-4 font-semibold text-black">{user.username}</td>
                                        <td className="p-4 text-gray-600">{user.email}</td>
                                        <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide border ${
                            user.role === "ADMIN" ? "bg-red-50 border-red-200 text-red-700" :
                                user.role === "NETWORK_ENGINEER" ? "bg-blue-50 border-blue-200 text-blue-700" :
                                    "bg-gray-50 border-gray-200 text-gray-700"
                        }`}>
                          {user.role}
                        </span>
                                        </td>
                                        <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                            {user.status}
                        </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* CREATE USER SUB-TAB */}
                {activeSubView === "create" && (
                    <form onSubmit={(e) => e.preventDefault()} className="max-w-2xl bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4 animate-fadeIn">
                        <h4 className="text-base font-bold text-black border-b pb-2 border-gray-100">Provision a New Operator Account</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                                <input type="text" className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm text-black focus:outline-none focus:border-black" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                                <input type="email" className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm text-black focus:outline-none focus:border-black" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password Credentials</label>
                                <input type="password" className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm text-black focus:outline-none focus:border-black" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">RBAC Security Claim</label>
                                <select className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm text-black focus:outline-none focus:border-black">
                                    <option value="VIEWER">VIEWER</option>
                                    <option value="NETWORK_ENGINEER">NETWORK_ENGINEER</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                            <button type="submit" className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                                Commit & Register User
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
        </div>
    );
}