import { z } from "zod";
import { getCookie } from "@/utils/cookies";
import {type CreateUserPayload, createUserSchema, type User, userSchema} from "@/schemas/users";

const API_URL = import.meta.env.VITE_API_URL;

const token = getCookie("token");

if (!token) {
    throw new Error("Authentication token not found.");
}

export async function getUsers(): Promise<User[]> {

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