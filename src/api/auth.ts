import type {LoginFields, LoginResponse} from "@/schemas/auth.ts";

const API_URL = import.meta.env.VITE_API_URL

export async function login({
                                username,
                                password,
                            }:LoginFields): Promise<LoginResponse> {
    const form = new URLSearchParams()
    form.append("username", username)
    form.append("password", password)

    const res = await fetch(API_URL + "/login/access-token", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: form.toString(),
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