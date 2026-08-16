import {Field, FieldLabel} from "@/components/ui/field.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useForm} from "react-hook-form";
import {type LoginFields, loginSchema} from "@/schemas/auth.ts";
import {zodResolver} from "@hookform/resolvers/zod";
import {useAuth} from "@/context/AuthProvider.tsx";
import {toast} from "sonner";
import {useNavigate} from "react-router";

/**
 * Renders the authentication page and manages the frontend login workflow.
 *
 * The page uses React Hook Form together with the Zod `loginSchema` to
 * validate user credentials before authentication is attempted.
 *
 * After successful authentication, the user's role is read from the
 * authentication context and used to redirect the user to the dashboard
 * associated with their role.
 *
 * The page also provides predefined demonstration accounts that can populate
 * the login form for the available application roles.
 *
 * @returns The application login interface.
 */
export default function LoginPage() {
    const { loginUser, roleRef } = useAuth();
    const navigate = useNavigate();

    /**
     * Predefined demonstration credentials for the application's supported
     * user roles.
     *
     * These accounts allow evaluators and demonstration users to populate
     * the login form without manually entering the corresponding credentials.
     */
    const demoUsers = {
        admin: {
            username: "admin_user",
            password: "password123",
        },
        engineer: {
            username: "engineer_user",
            password: "password123",
        },
        viewer: {
            username: "viewer_user",
            password: "password123",
        },
    };

    /**
     * Populates the login form with the credentials of a selected
     * demonstration account.
     *
     * The selected role is used as a key to retrieve the corresponding
     * username and password from `demoUsers`. React Hook Form's `setValue`
     * function then updates the form fields.
     *
     * @param role - Demonstration account whose credentials should be loaded
     * into the login form.
     */
    const selectDemoUser = (role: keyof typeof demoUsers) => {
        setValue("username", demoUsers[role].username);
        setValue("password", demoUsers[role].password);
    };

    /**
     * Configures the authentication form.
     *
     * React Hook Form manages the form state and submission lifecycle,
     * while the Zod resolver validates the supplied credentials against
     * `loginSchema`.
     *
     * `setValue` is also exposed so demonstration credentials can be
     * inserted programmatically.
     */
    const {
        register,
        handleSubmit,
        setValue,
        formState: {errors, isSubmitting}
    } = useForm<LoginFields>({
        resolver: zodResolver(loginSchema)
    })

    /**
     * Authenticates the user and redirects them to the dashboard associated
     * with their assigned role.
     *
     * Authentication is delegated to `loginUser`, which establishes the
     * frontend authentication session and updates the current role reference.
     * Once authentication completes, the role is read synchronously from
     * `roleRef` and used to determine the appropriate destination.
     *
     * Role-based navigation is handled as follows:
     * - `ADMIN` users are redirected to the administrator dashboard.
     * - `NETWORK_ENGINEER` users are redirected to the engineer dashboard.
     * - `VIEWER` users are redirected to the viewer dashboard.
     * - Unknown or unavailable roles are redirected to the home page.
     *
     * Authentication failures are presented to the user through a toast
     * notification.
     *
     * @param data - Validated login credentials submitted through the form.
     *
     * @returns A Promise that resolves after the authentication and navigation
     * workflow has completed.
     */
    const onSubmit = async (data: LoginFields) => {
        try {
            /*
             * Wait for authentication to complete before reading the role,
             * ensuring that the authentication context and role reference
             * have been updated.
             */
            await loginUser(data);

            const userRole = roleRef.current;

            toast.success("Login successful");

            /*
             * Redirect the authenticated user to the dashboard associated
             * with their assigned application role.
             */
            if (userRole === "ADMIN") {
                navigate("/admin");
            } else if (userRole === "NETWORK_ENGINEER") {
                navigate("/engineer");
            } else if (userRole === "VIEWER") {
                navigate("/viewer");
            } else {
                navigate("/");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Login failed");
        }
    }

    return (
        <>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="max-w-sm mx-auto p-8 space-y-6 border rounded bg-custom-primary-light shadow"
            >
                <h1 className="text-2xl font-bold text-center text-black mb-4">Login</h1>
                <Field>
                    <FieldLabel htmlFor="username" className="text-black">Username</FieldLabel>
                    <Input id="username" className="bg-white" {...register("username")}/>
                    {errors.username && (
                        <div className="text-custom-dark-red text-sm">{errors.username.message}</div>
                    )}
                </Field>
                <Field>
                    <FieldLabel htmlFor="password" className="text-black">Password</FieldLabel>
                    <Input id="password" type="password" className="bg-white" {...register("password")}/>
                    {errors.password && (
                        <div className="text-custom-dark-red text-sm">{errors.password.message}</div>
                    )}
                </Field>
                <Button type="submit" className="w-full">
                    {isSubmitting ? "Logging in..." : "Login"}
                </Button>
                <div className="text-center">
                    <select className="text-center"
                        defaultValue=""
                        onChange={(e) => {
                            if (e.target.value) {
                                selectDemoUser(e.target.value as keyof typeof demoUsers);
                            }
                        }}
                    >
                        <option value="">Select demo user</option>
                        <option value="admin">Admin</option>
                        <option value="engineer">Network Engineer</option>
                        <option value="viewer">Viewer</option>
                    </select>
                </div>

            </form>
        </>
    )
}