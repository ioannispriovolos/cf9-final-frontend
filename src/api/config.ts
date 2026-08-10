import {getCookie} from "@/utils/cookies.ts";

export const API_URL = import.meta.env.VITE_API_URL;

/**
 * Builds the HTTP headers required for authenticated backend requests.
 *
 * The function retrieves the JWT authentication token from the application's
 * cookies and includes it in the `Authorization` header using the Bearer
 * authentication scheme.
 *
 * The returned headers also specify that the request body uses JSON.
 *
 * @returns A `HeadersInit` object containing the JSON content type and
 * Bearer authorization header.
 *
 * @throws {Error} Throws an error if the authentication token cannot be found
 * in the application's cookies.
 */
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

/**
 * Extracts a meaningful error message from an unsuccessful HTTP response.
 *
 * The function attempts to parse the response body as JSON and checks for
 * commonly used backend error properties.
 *
 * The `detail` property is checked first, followed by `message`.
 * If neither property is available, or if the response body cannot be parsed
 * as JSON, the provided fallback message is returned together with the
 * HTTP status code.
 *
 * @param response - The unsuccessful HTTP response returned by the backend.
 * @param fallbackMessage - The default message to use when the backend
 * does not provide a readable error description.
 *
 * @returns A Promise that resolves to the most appropriate error message.
 */
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