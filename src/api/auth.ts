import type {LoginFields, LoginResponse} from "@/schemas/auth.ts";

const API_URL = import.meta.env.VITE_API_URL

export async function login({
                                username,
                                password,
                            }:LoginFields): Promise<LoginResponse> {
    const form = new URLSearchParams()
    form.append("username", username)
    form.append("password", password)

    // Convert FormData or an object to a valid JSON string
    const payload = Object.fromEntries(new URLSearchParams(form.toString()));

    const res = await fetch(API_URL + "/auth/authenticate", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload), // Correctly formatted JSON
    })

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
    return await res.json()
}