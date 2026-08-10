import { getCookie } from "@/utils/cookies";

import {
    createUserPayloadSchema,
    deleteUserSchema,
    pageResponseSchema,
    ROLE_TO_ID_MAP,
    searchUserSchema,
    updateUserSchema,
    userSchema,
    type CreateUserPayload,
    type DeleteUserPayload,
    type PageResponse,
    type UpdateUserPayload,
    type User,
} from "@/schemas/users";

const API_URL =
    import.meta.env.VITE_API_URL;

/**
 * Builds the HTTP headers required for authenticated backend API requests.
 *
 * The function retrieves the JWT authentication token from the application's
 * cookies and includes it in the `Authorization` header using the Bearer
 * authentication scheme.
 *
 * All requests declare that JSON responses are accepted. The
 * `Content-Type: application/json` header is added only when explicitly
 * requested, which is useful for operations that send a JSON request body.
 *
 * @param includeContentType - Determines whether the
 * `Content-Type: application/json` header should be included.
 * Defaults to `false`.
 *
 * @returns A `HeadersInit` object containing the headers required for the
 * authenticated API request.
 *
 * @throws {Error} Throws an error if the authentication token cannot be
 * found in the application's cookies.
 */
function getAuthorizationHeaders(
    includeContentType = false
): HeadersInit {
    const token = getCookie("token");

    if (!token) {
        throw new Error(
            "Authentication token was not found."
        );
    }

    return {
        Accept: "application/json",

        ...(includeContentType
            ? {
                "Content-Type":
                    "application/json",
            }
            : {}),

        Authorization: `Bearer ${token}`,
    };
}

/**
 * Extracts a meaningful error message from an unsuccessful backend response.
 *
 * The function attempts to parse the response body as JSON and retrieve an
 * error description from commonly used backend response properties.
 *
 * The `message` property is checked first, followed by `detail`. If neither
 * property contains a string, or if the response does not contain a valid
 * JSON body, the supplied fallback message is returned together with the
 * HTTP status code.
 *
 * @param response - The unsuccessful HTTP response returned by the backend.
 * @param fallbackMessage - The default error message to use when the backend
 * does not provide a readable error description.
 *
 * @returns A Promise that resolves to the most appropriate error message.
 */
async function getErrorMessage(
    response: Response,
    fallbackMessage: string
): Promise<string> {
    try {
        const data: unknown =
            await response.json();

        if (
            typeof data === "object" &&
            data !== null
        ) {
            if (
                "message" in data &&
                typeof data.message === "string"
            ) {
                return data.message;
            }

            if (
                "detail" in data &&
                typeof data.detail === "string"
            ) {
                return data.detail;
            }
        }
    } catch {
        // Response has no JSON error body.
    }

    return `${fallbackMessage} (${response.status})`;
}

/**
 * Retrieves a single user from the backend using the user's UUID.
 *
 * Before the request is sent, the supplied UUID is trimmed, converted to
 * lowercase, and validated against `searchUserSchema`.
 *
 * An authenticated GET request is then sent to the corresponding user
 * endpoint. The returned JSON response is treated as unknown external data
 * until it has been validated against `userSchema`.
 *
 * @param uuid - The UUID identifying the user to retrieve.
 *
 * @returns A Promise that resolves to a validated `User`.
 *
 * @throws {Error} Throws an error if the backend request is unsuccessful.
 */
export async function getUserByUuid(
    uuid: string
): Promise<User> {
    const validated =
        searchUserSchema.parse({
            uuid: uuid
                .trim()
                .toLowerCase(),
        });

    const response = await fetch(
        `${API_URL}/users/${validated.uuid}`,
        {
            method: "GET",
            headers:
                getAuthorizationHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "User identifier not found."
            )
        );
    }

    const data: unknown =
        await response.json();

    return userSchema.parse(data);
}

/**
 * Retrieves a paginated collection of users from the backend directory.
 *
 * The requested page number, page size, and sorting configuration are
 * converted into URL query parameters and sent with an authenticated
 * GET request.
 *
 * The backend response is parsed as JSON and validated against
 * `pageResponseSchema` before being returned to the application. This ensures
 * that both the user records and pagination metadata match the structure
 * expected by the frontend.
 *
 * @param page - Zero-based page index to retrieve. Defaults to `0`.
 * @param size - Maximum number of users to retrieve per page. Defaults to `5`.
 * @param sort - Spring-style sorting expression. Defaults to `username,asc`.
 *
 * @returns A Promise that resolves to a validated `PageResponse` containing
 * the users and their pagination metadata.
 *
 * @throws {Error} Throws an error if the backend request is unsuccessful.
 */
export async function getUsersPaginated(
    page = 0,
    size = 5,
    sort = "username,asc"
): Promise<PageResponse> {
    const query =
        new URLSearchParams({
            page: String(page),
            size: String(size),
            sort,
        });

    const response = await fetch(
        `${API_URL}/users/allusers?${query.toString()}`,
        {
            method: "GET",
            headers:
                getAuthorizationHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to retrieve user directory."
            )
        );
    }

    const data: unknown =
        await response.json();

    return pageResponseSchema.parse(data);
}

/**
 * Creates a new user account through the backend API.
 *
 * The supplied user information is first validated against
 * `createUserPayloadSchema`. The validated payload is then serialized as JSON
 * and submitted through an authenticated POST request.
 *
 * The backend remains responsible for authoritative validation, password
 * hashing, persistence, role assignment, and authorization of the operation.
 *
 * @param payload - The user information required to create the new account,
 * including the username, password, and selected role identifier.
 *
 * @returns A Promise that resolves when the user has been created
 * successfully.
 *
 * @throws {Error} Throws an error if the backend rejects the creation request.
 */
export async function createUser(
    payload: CreateUserPayload
): Promise<void> {
    const validated =
        createUserPayloadSchema.parse(
            payload
        );

    const response = await fetch(
        `${API_URL}/users`,
        {
            method: "POST",
            headers:
                getAuthorizationHeaders(true),

            body: JSON.stringify(
                validated
            ),
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to provision new user identity."
            )
        );
    }
}

/**
 * Updates an existing user account through the backend API.
 *
 * The supplied update data is first validated against `updateUserSchema`.
 * The frontend then transforms the selected role into the numeric role
 * identifier expected by the backend.
 *
 * A `null` role produces a `null` role identifier, allowing the backend to
 * preserve the user's existing role when no role change has been requested.
 *
 * The resulting update request is serialized as JSON and submitted through
 * an authenticated PUT request to the endpoint identified by the user's UUID.
 *
 * @param payload - The user update information containing the target UUID,
 * username, and optional role modification.
 *
 * @returns A Promise that resolves when the user has been updated
 * successfully.
 *
 * @throws {Error} Throws an error if the backend rejects the update request.
 * @throws {ZodError} Throws a Zod validation error if the supplied payload
 * does not match `updateUserSchema`.
 */
export async function updateUser(
    payload: UpdateUserPayload
): Promise<void> {
    const validated =
        updateUserSchema.parse(payload);

    /*
     * Convert the frontend role representation into
     * the numeric role identifier expected by the backend.
     */
    const body = {
        username: validated.username,

        roleId:
            validated.role === null
                ? null
                : ROLE_TO_ID_MAP[
                    validated.role
                    ],
    };

    const response = await fetch(
        `${API_URL}/users/${validated.uuid}`,
        {
            method: "PUT",

            headers:
                getAuthorizationHeaders(true),

            body: JSON.stringify(body),
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to update user."
            )
        );
    }
}

/**
 * Soft-deletes an existing user account through the backend API.
 *
 * The target user's UUID is validated against `deleteUserSchema` before the
 * request is sent. An authenticated PATCH request is then submitted to the
 * backend endpoint associated with that user.
 *
 * This operation performs a soft deletion rather than physically removing
 * the user record. The backend is responsible for marking the account as
 * inactive and retaining the record according to the application's
 * persistence and auditing rules.
 *
 * @param payload - The payload containing the UUID of the user to soft-delete.
 *
 * @returns A Promise that resolves when the soft-delete operation completes
 * successfully.
 *
 * @throws {Error} Throws an error if the backend rejects the deletion request.
 */
export async function deleteUser(
    payload: DeleteUserPayload
): Promise<void> {
    const validated =
        deleteUserSchema.parse(payload);

    const response = await fetch(
        `${API_URL}/users/${validated.uuid}`,
        {
            method: "PATCH",

            headers:
                getAuthorizationHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to soft delete user."
            )
        );
    }
}