import type {LoginFields} from "src/schemas/auth.ts";
import {createContext, useContext, useState} from "react";
import {jwtDecode} from "jwt-decode";
import {deleteCookie, getCookie, setCookie} from "src/utils/cookies.ts";
import {login} from "src/api/auth.ts";

type AuthContextProps = {
    isAuthenticated: boolean;
    accessToken: string | null;
    tenantId: string | null;
    loginUser: (fields: LoginFields) => Promise<void>;
    logoutUser: () => void;
}

type JwtPayload = {
    email?: string;
    tenant_id: string;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

function readTenantFromToken(token: string | null): string | null {
    if (!token) return null;
    try {
        return jwtDecode<JwtPayload>(token).tenant_id ?? null;
    } catch {
        return null;
    }
}

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
    const cookieAccessToken = getCookie("access_token")

    const [accessToken, setAccessToken] = useState<string | null>(
        () => cookieAccessToken ?? null
    );

    const [tenantId, setTenantId] = useState<string | null>(
        readTenantFromToken(cookieAccessToken ?? null)
    );

    const loginUser = async (fields: LoginFields) => {
        const res = await login(fields);
        setCookie("access_token", res.access_token, {
            expires: 1,
            SameSite: "Lax",
            secure: false,
            path: "/",
        });
        setAccessToken(res.access_token);
        setTenantId(readTenantFromToken(res.access_token));
    }

    const logoutUser = () => {
        deleteCookie("access_token");
        setAccessToken(null);
        setTenantId(null);
    }

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: !!accessToken,
                accessToken,
                tenantId,
                loginUser,
                logoutUser,
            }}>
            {children}
        </AuthContext.Provider>

    )
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}