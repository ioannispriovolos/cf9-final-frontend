import { z } from "zod";
import { getCookie } from "@/utils/cookies";
import { type User, userSchema } from "@/schemas/users";

const API_URL = import.meta.env.VITE_API_URL;

export async function getUsers(): Promise<User[]> {
    const token = getCookie("token");

    if (!token) {
        throw new Error("Authentication token not found.");
    }

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