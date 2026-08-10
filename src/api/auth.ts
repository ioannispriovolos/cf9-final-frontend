import type {LoginFields, LoginResponse} from "@/schemas/auth.ts";

const API_URL = import.meta.env.VITE_API_URL

/**
 * Authenticates a user against the backend authentication endpoint.
 *
 * The function receives the user's login credentials, converts them into
 * a JSON-compatible payload, and sends them to the backend using a POST request.
 *
 * If authentication succeeds, the parsed JSON response returned by the backend
 * is returned to the caller. This response typically contains authentication
 * information such as a JWT token and/or user-related data, depending on the
 * backend implementation.
 *
 * If authentication fails, the function attempts to extract the `detail`
 * property from the backend error response and throws it as a JavaScript Error.
 * If the error response cannot be parsed, a generic "Login Failed" message
 * is used instead.
 *
 * @param username - The username entered by the user.
 * @param password - The password entered by the user.
 *
 * @returns A Promise that resolves with the parsed JSON authentication response.
 *
 * @throws {Error} Throws an error when the backend returns a non-successful
 * HTTP response.
 */
export async function login({
                                username,
                                password,
                            }:LoginFields): Promise<LoginResponse> {
    const form = new URLSearchParams()
    form.append("username", username)
    form.append("password", password)

    // Convert the URLSearchParams data into a plain object that can be serialized as JSON.
    const payload = Object.fromEntries(new URLSearchParams(form.toString()));

    // Send the authentication request to the backend.
    const res = await fetch(API_URL + "/auth/authenticate", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload), // Correctly formatted JSON
    })

    // Handle unsuccessful authentication responses.
    if (!res.ok) {
        let detail = "Login Failed"
        try {
            const data = await res.json()
            if (typeof data?.detail === "string") detail = data.detail
        } catch (error){
            console.error("Error parsing login response", error)
        }
        throw new Error(detail)
    }
    // Return the successful authentication response.
    return await res.json()
}