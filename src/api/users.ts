import { z } from "zod";
import { getCookie } from "@/utils/cookies";
import {
    type CreateUserPayload,
    createUserSchema, type DeleteUserPayload, deleteUserSchema, type PageResponse, PageResponseSchema,
    type UpdateUserPayload,
    updateUserSchema,
    type User,
    userSchema
} from "@/schemas/users";

const API_URL = import.meta.env.VITE_API_URL;

const roleMap = {
    ADMIN: 1,
    NETWORK_ENGINEER: 2,
    VIEWER: 3,
} as const;

export async function getUsers(): Promise<User[]> {

    const token = getCookie("token");

    const res = await fetch(`${API_URL}/users/allusers`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch users (${res.status})`);
    }

    const data = await res.json();
    return z.array(userSchema).parse(data);
}

export async function createUser(payload: CreateUserPayload): Promise<void> {

    const token = getCookie("token");

    const validatedData = createUserSchema.parse(payload);

    const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(validatedData),
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to provision new user identity.");
    }
}

export async function updateUser(payload: UpdateUserPayload): Promise<void> {
    const token = getCookie("token");

    const validated = updateUserSchema.parse(payload);

    const body = {
        username: validated.username || null,
        roleId:
            validated.role === null
                ? null
                : roleMap[validated.role],
    };

    const res = await fetch(`${API_URL}/users/${validated.uuid}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to update user.");
    }
}

export async function deleteUser(payload: DeleteUserPayload): Promise<void> {

    const token = getCookie("token");

    const validated = deleteUserSchema.parse(payload);

    const res = await fetch(`${API_URL}/users/${validated.uuid}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));

        throw new Error(
            err.message ?? "Failed to soft delete user."
        );
    }
}

export async function getUsersPaginated(
    page = 0,
    size = 5,
    sort = "username,asc"
): Promise<PageResponse> {
    const token = getCookie("token");

    // Endpoint matching @GetMapping("/allusers") with Pageable query parameters
    const url = `${API_URL}/users/allusers?page=${page}&size=${size}&sort=${sort}`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error("Failed to retrieve paginated user directory.");
    }

    const rawData = await res.json();

    // Parses response against your PageResponseDTO structure
    return PageResponseSchema.parse(rawData);
}