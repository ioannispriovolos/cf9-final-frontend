import {useAuth} from "@/context/AuthProvider.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useNavigate} from "react-router";
import {toast} from "sonner";

/**
 * Renders an authentication-aware navigation button.
 *
 * The component uses the application's authentication context to determine
 * whether the current user is authenticated.
 *
 * When the user is not authenticated, a Login button is displayed and
 * redirects the user to the login page.
 *
 * When the user is authenticated, a Logout button is displayed. Logging out
 * clears the current authentication state, displays a confirmation toast,
 * and redirects the user to the application's home page.
 *
 * @returns A Login or Logout button depending on the current
 * authentication state.
 */
export function AuthButton() {
    const { isAuthenticated, logoutUser } = useAuth();
    const navigate = useNavigate();

    /**
     * Navigates the user to the login page.
     */
    const handleLogin = () => {
        navigate("/login")
    }

    /**
     * Logs out the currently authenticated user.
     *
     * The authentication state is cleared through the authentication
     * context, a success notification is displayed, and the user is
     * redirected to the application's home page.
     */
    const handleLogout = () => {
        logoutUser();
        toast.success("Logged out!");
        navigate("/");
    }

    return isAuthenticated ? (
        <Button variant="default" onClick={handleLogout}>Logout</Button>
    ) : (
        <Button variant="secondary" onClick={handleLogin}>Login</Button>
    )
}