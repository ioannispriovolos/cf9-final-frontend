import { z } from "zod";

export const roleSchema = z.enum([
    "ADMIN",
    "NETWORK_ENGINEER",
    "VIEWER",
]);

export type RoleOption = z.infer<
    typeof roleSchema
>;

export const ROLE_TO_ID_MAP: Record<
    RoleOption,
    number
> = {
    ADMIN: 1,
    NETWORK_ENGINEER: 2,
    VIEWER: 3,
};

const passwordRegex =
    /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&+=]).{8,}$/;

/* =========================================
   User returned from backend
========================================= */

export const userSchema = z.object({
    uuid: z.uuid({
        message: "Invalid canonical UUID format.",
    }),

    username: z
        .string()
        .trim()
        .min(1, {
            message: "Username cannot be empty.",
        }),

    role: roleSchema,
});

export type User = z.infer<
    typeof userSchema
>;

/* =========================================
   Search user
========================================= */

export const searchUserSchema = z.object({
    uuid: z.uuid({
        message: "Please enter a valid UUID.",
    }),
});

export type SearchUserPayload = z.infer<
    typeof searchUserSchema
>;

/* =========================================
   Create user form
========================================= */

export const createUserFormSchema = z
    .object({
        username: z
            .string()
            .trim()
            .min(2, {
                message:
                    "Username must contain at least 2 characters.",
            })
            .max(20, {
                message:
                    "Username must not exceed 20 characters.",
            }),

        password: z
            .string()
            .regex(passwordRegex, {
                message:
                    "Password must be at least 8 characters long and contain uppercase, lowercase, a number, and a special character (!@#$%^&+=).",
            }),

        confirmPassword: z
            .string()
            .min(1, {
                message:
                    "Please confirm the password.",
            }),

        role: roleSchema,
    })
    .refine(
        ({ password, confirmPassword }) =>
            password === confirmPassword,
        {
            path: ["confirmPassword"],
            message: "Passwords do not match.",
        }
    );

export type CreateUserFormData = z.infer<
    typeof createUserFormSchema
>;

/*
 * Exact payload expected by backend.
 */
export const createUserPayloadSchema = z.object({
    username: z
        .string()
        .trim()
        .min(2)
        .max(20),

    password: z
        .string()
        .regex(passwordRegex),

    roleId: z
        .number()
        .int()
        .positive(),
});

export type CreateUserPayload = z.infer<
    typeof createUserPayloadSchema
>;

/* =========================================
   Update user
========================================= */

export const updateUserSchema = z.object({
    uuid: z.uuid({
        message: "Please enter a valid UUID.",
    }),

    username: z
        .string()
        .trim()
        .min(2, {
            message:
                "Username must contain at least 2 characters.",
        })
        .max(20, {
            message:
                "Username must not exceed 20 characters.",
        }),

    role: roleSchema.nullable(),
});

export type UpdateUserPayload = z.infer<
    typeof updateUserSchema
>;

/* =========================================
   Delete user
========================================= */

export const deleteUserSchema = z.object({
    uuid: z.uuid({
        message: "Please enter a valid UUID.",
    }),
});

export type DeleteUserPayload = z.infer<
    typeof deleteUserSchema
>;

/* =========================================
   Pagination
========================================= */

export const pageResponseSchema = z.object({
    content: z.array(userSchema),

    page: z
        .number()
        .int()
        .nonnegative(),

    size: z
        .number()
        .int()
        .positive(),

    totalElements: z
        .number()
        .int()
        .nonnegative(),

    totalPages: z
        .number()
        .int()
        .nonnegative(),

    first: z.boolean(),

    last: z.boolean(),
});

export type PageResponse = z.infer<
    typeof pageResponseSchema
>;