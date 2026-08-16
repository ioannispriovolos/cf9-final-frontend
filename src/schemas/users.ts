import { z } from "zod";

/**
 * Defines the application roles recognized by the frontend.
 *
 * The values correspond directly to the role names returned by the backend
 * and used throughout the application for role-based UI behavior and
 * authorization-aware navigation.
 */
export const roleSchema = z.enum([
    "ADMIN",
    "NETWORK_ENGINEER",
    "VIEWER",
]);

/**
 * Represents one of the application roles defined by `roleSchema`.
 *
 * The type is inferred directly from the Zod schema so the compile-time
 * representation remains synchronized with runtime validation.
 */
export type RoleOption = z.infer<
    typeof roleSchema
>;

/**
 * Maps frontend role names to the numeric role identifiers expected
 * by the backend API.
 *
 * This mapping is used when converting role selections from the user
 * interface into backend-compatible request payloads.
 */
export const ROLE_TO_ID_MAP: Record<
    RoleOption,
    number
> = {
    ADMIN: 1,
    NETWORK_ENGINEER: 2,
    VIEWER: 3,
};

/**
 * Regular expression used to validate user password complexity.
 *
 * A valid password must:
 * - contain at least one digit;
 * - contain at least one lowercase letter;
 * - contain at least one uppercase letter;
 * - contain at least one supported special character (!@#$%^&+=);
 * - contain at least eight characters in total.
 */
const passwordRegex =
    /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&+=]).{8,}$/;

/**
 * Defines the structure of a user returned by the backend.
 *
 * The schema validates the user's UUID, username, and assigned application
 * role before the data is exposed to frontend components.
 */
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

/**
 * Represents a validated user returned by the backend.
 *
 * The TypeScript type is inferred from `userSchema`, ensuring that
 * compile-time typing remains synchronized with runtime validation.
 */
export type User = z.infer<
    typeof userSchema
>;

/**
 * Defines the validation schema used when searching for a user by UUID.
 *
 * The supplied identifier must be a valid UUID before a backend lookup
 * request can be performed.
 */
export const searchUserSchema = z.object({
    uuid: z.uuid({
        message: "Please enter a valid UUID.",
    }),
});

/**
 * Represents a validated user-search request.
 */
export type SearchUserPayload = z.infer<
    typeof searchUserSchema
>;

/**
 * Defines the validation rules for the create-user form.
 *
 * The schema validates the username, password complexity, password
 * confirmation, and selected application role.
 *
 * Password confirmation exists only at the presentation layer and is
 * validated against the primary password before a backend payload is built.
 */
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

/**
 * Represents validated values from the create-user form.
 *
 * This type includes presentation-specific values such as
 * `confirmPassword` and the role's symbolic name.
 */
export type CreateUserFormData = z.infer<
    typeof createUserFormSchema
>;

/**
 * Defines the exact user-creation payload expected by the backend API.
 *
 * Unlike `createUserFormSchema`, this schema does not contain the password
 * confirmation field. The selected frontend role is also represented by
 * its numeric backend identifier rather than its symbolic role name.
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

/**
 * Represents the validated payload sent to the backend when creating
 * a new user.
 */
export type CreateUserPayload = z.infer<
    typeof createUserPayloadSchema
>;

/**
 * Defines the validation rules for updating an existing user.
 *
 * The target user is identified by UUID. The username must contain between
 * 2 and 20 characters, while the role may be either a valid application role
 * or null.
 *
 * A null role indicates that no role modification has been requested and
 * allows the backend to preserve the user's existing role.
 */
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

/**
 * Represents a validated user-update request.
 */
export type UpdateUserPayload = z.infer<
    typeof updateUserSchema
>;

/**
 * Defines the validation schema for a user soft-delete request.
 *
 * The user must be identified by a valid UUID before the deletion request
 * can be sent to the backend.
 */
export const deleteUserSchema = z.object({
    uuid: z.uuid({
        message: "Please enter a valid UUID.",
    }),
});

/**
 * Represents a validated user soft-delete request.
 */
export type DeleteUserPayload = z.infer<
    typeof deleteUserSchema
>;

/**
 * Defines the structure of a paginated user-directory response returned
 * by the backend.
 *
 * The response contains the users belonging to the requested page together
 * with data required by the frontend pagination controls.
 */
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

/**
 * Represents a validated paginated user-directory response.
 *
 * The type is inferred directly from `pageResponseSchema` so the
 * TypeScript definition remains synchronized with the backend response
 * validation performed at runtime.
 */
export type PageResponse = z.infer<
    typeof pageResponseSchema
>;