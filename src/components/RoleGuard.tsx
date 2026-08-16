import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthProvider"; // Adjust this path to your AuthProvider

/**
 * Protects nested routes based on authentication state and user role.
 *
 * The guard verifies that the current user is authenticated and that their
 * assigned role is included in the collection of roles permitted to access
 * the protected route.
 *
 * Route access is handled as follows:
 * - Unauthenticated users are redirected to the login page.
 * - Authenticated users without an authorized role are redirected to the
 *   application's home page.
 * - Authenticated users with an authorized role are allowed to access the
 *   nested route rendered through React Router's `Outlet`.
 *
 * The current role is read from `roleRef`, allowing the guard to access the
 * latest role value synchronously without waiting for an additional state
 * update.
 *
 * This component provides client-side route protection for the user
 * interface. Authorization of protected backend resources must still be
 * enforced independently by the backend security layer.
 *
 * @param allowedRoles - Collection of user roles permitted to access the
 * protected route.
 *
 * @returns A redirect when access is denied, or an `Outlet` containing the
 * protected child route when authorization succeeds.
 */
export default function RoleGuard({ allowedRoles }: { allowedRoles: string[] }) {
    const { roleRef, isAuthenticated } = useAuth();

    // Retrieve the current role synchronously from the authentication context.
    const currentRole = roleRef.current;

    /*
     * Redirect unauthenticated users to the login page before
     * attempting role-based authorization.
     */
    if (!isAuthenticated) {
        // If not logged in at all, kick them to the login page
        return <Navigate to="/login" replace />;
    }

    /*
     * Redirect authenticated users who either have no assigned role
     * or do not belong to one of the roles authorized for this route.
     */
    if (!currentRole || !allowedRoles.includes(currentRole)) {
        return <Navigate to="/" replace />;
    }

    /*
     * Authentication and role checks succeeded.
     * Render the protected nested route.
     */
    return <Outlet />;
}