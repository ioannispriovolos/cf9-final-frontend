import {Field, FieldLabel} from "@/components/ui/field.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useForm} from "react-hook-form";
import {type LoginFields, loginSchema} from "@/schemas/auth.ts";
import {zodResolver} from "@hookform/resolvers/zod";
import {useAuth} from "@/context/AuthProvider.tsx";
import {toast} from "sonner";
import {useNavigate} from "react-router";

export default function LoginPage() {
    const { loginUser, roleRef } = useAuth();
    const navigate = useNavigate();

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

    const selectDemoUser = (role: keyof typeof demoUsers) => {
        setValue("username", demoUsers[role].username);
        setValue("password", demoUsers[role].password);
    };

    const {
        register,
        handleSubmit,
        setValue,
        formState: {errors, isSubmitting}
    } = useForm<LoginFields>({
        resolver: zodResolver(loginSchema)
    })

    const onSubmit = async (data: LoginFields) => {
        try {
            // 1. Await the authentication process to finish setting the cookie/ref
            await loginUser(data);

            // 2. CRUCIAL: Create the missing 'userRole' variable by reading the ref
            const userRole = roleRef.current;

            toast.success("Login successful");

            // 3. Now the compiler knows exactly what 'userRole' means!
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