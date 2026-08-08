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

/* =========================================
   Shared API helpers
========================================= */

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

/* =========================================
   Read one user
========================================= */

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

/* =========================================
   Paginated users
========================================= */

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

/* =========================================
   Create
========================================= */

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

/* =========================================
   Update
========================================= */

export async function updateUser(
    payload: UpdateUserPayload
): Promise<void> {
    const validated =
        updateUserSchema.parse(payload);

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

/* =========================================
   Soft delete
========================================= */

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