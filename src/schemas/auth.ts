import {z} from "zod";

/**
 * Defines the validation schema for user login credentials.
 *
 * Both the username and password are required before an authentication
 * request can be submitted. The schema is used to validate login form data
 * and provides user-facing validation messages when required fields are empty.
 *
 * The actual verification of the supplied credentials is performed by the
 * backend authentication service.
 */
export const loginSchema = z.object({
    username: z.string().min(1, {error: "Username is required"}),
    password: z.string().min(1, {error: "Password is required"}),
})

/**
 * Represents validated login form data.
 *
 * The type is inferred directly from `loginSchema`, ensuring that the
 * TypeScript representation remains synchronized with the runtime
 * validation rules.
 */
export type LoginFields = z.infer<typeof loginSchema>

/**
 * Represents the authentication response returned by the backend
 * after a successful login.
 *
 * The response contains the JWT access token used for subsequent
 * authenticated API requests together with the token type.
 */
export type LoginResponse = {
    token: string;
    token_type: string;
}