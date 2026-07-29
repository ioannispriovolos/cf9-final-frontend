import {getCookie} from "@/utils/cookies.ts";

export const API_URL = import.meta.env.VITE_API_URL;

export function getAuthorizationHeaders(): HeadersInit {
    const token = getCookie("token");

    if (!token) {
        throw new Error("Authentication token not found.");
    }

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function getErrorMessage(
    response: Response,
    fallbackMessage: string,
): Promise<string> {
    try {
        const data: unknown = await response.json();

        if (
            typeof data === "object" &&
            data !== null
        ) {
            if (
                "detail" in data &&
                typeof data.detail === "string"
            ) {
                return data.detail;
            }

            if (
                "message" in data &&
                typeof data.message === "string"
            ) {
                return data.message;
            }
        }
    } catch {
        // The backend may have returned an empty body or non-JSON response.
    }

    return `${fallbackMessage} (${response.status})`;
}