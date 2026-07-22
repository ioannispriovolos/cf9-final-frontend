import {z} from "zod";

const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&+=]).{8,}$/;

// Role options available in your UI selector
export type RoleOption = "ADMIN" | "NETWORK_ENGINEER" | "VIEWER";

// Maps string options to backend numeric IDs
export const ROLE_TO_ID_MAP: Record<RoleOption, number> = {
    ADMIN: 1,
    NETWORK_ENGINEER: 2,
    VIEWER: 3,
};

export const userSchema = z.object({
    uuid: z.uuid({ message: "Invalid canonical UUID format" }),
    username: z.string().min(1, { message: "Username cannot be empty" }),
    role: z.enum(["ADMIN", "NETWORK_ENGINEER", "VIEWER"]),
});

export type User = z.infer<typeof userSchema>;

export const createUserSchema = z.object({
    username: z.string().min(2, { message: "Username is required" }).max(20),
    password: z.string().regex(passwordRegex, {
        message: "Password must be at least 8 characters long and contain uppercase, lowercase, a number, and a special character (!@#$%^&+=)."
    }),
    roleId: z.number().int({ message: "Role selection must be an integer ID" }),
});

export type CreateUserPayload = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
    uuid: z.uuid(),
    username: z.string().min(2).max(20).optional(),
    role: z.union([
        z.literal("ADMIN"),
        z.literal("NETWORK_ENGINEER"),
        z.literal("VIEWER"),
        z.null(),
    ]),
});

export type UpdateUserPayload = z.infer<typeof updateUserSchema>;

export const deleteUserSchema = z.object({
    uuid: z.uuid({
        message: "Please enter a valid UUID.",
    }),
});

export type DeleteUserPayload = z.infer<typeof deleteUserSchema>;

export const UserReadOnlySchema = z.object({
    uuid: z.string(),
    username: z.string(),
    role: z.enum(["ADMIN", "NETWORK_ENGINEER", "VIEWER"]).catch("VIEWER"),
});

export type UserPaginated = z.infer<typeof UserReadOnlySchema>;

// Matches PageResponseDTO<T>
export const PageResponseSchema = z.object({
    content: z.array(UserReadOnlySchema),
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
    first: z.boolean(),
    last: z.boolean(),
});

export type PageResponse = z.infer<typeof PageResponseSchema>;