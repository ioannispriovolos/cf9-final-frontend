import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthProvider"; // Adjust this path to your AuthProvider

// We pass an array of allowed roles to this guard component
export default function RoleGuard({ allowedRoles }: { allowedRoles: string[] }) {
    const { roleRef, isAuthenticated } = useAuth();

    // Read the synchronous ref value instantly
    const currentRole = roleRef.current;

    if (!isAuthenticated) {
        // If not logged in at all, kick them to the login page
        return <Navigate to="/login" replace />;
    }

    if (!currentRole || !allowedRoles.includes(currentRole)) {
        // If they don't have the right role, redirect them to a safe fallback page
        return <Navigate to="/" replace />;
    }

    // If they pass the checks, Outlet renders the child components (like AdminDashboard)
    return <Outlet />;
}