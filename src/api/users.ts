import { z } from "zod";
import { getCookie } from "@/utils/cookies";
import {
    type CreateUserPayload,
    createUserSchema,
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