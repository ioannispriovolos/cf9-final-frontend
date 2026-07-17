import type {LoginFields} from "src/schemas/auth.ts";
import {createContext, useContext, useRef, useState} from "react";
import {jwtDecode} from "jwt-decode";
import {deleteCookie, getCookie, setCookie} from "src/utils/cookies.ts";
import {login} from "src/api/auth.ts";

type AuthContextProps = {
    isAuthenticated: boolean;
    accessToken: string | null;
    role: string | null;
    roleRef: React.RefObject<string | null>; // 1. Expose the ref to the context
    loginUser: (fields: LoginFields) => Promise<void>;
    logoutUser: () => void;
}

type JwtPayload = {
    role: string;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

function readRoleFromToken(token: string | null): string | null {
    if (!token) return null;
    try {
        return jwtDecode<JwtPayload>(token).role ?? null;
    } catch {
        return null;
    }
}

export const AuthProvider = ({children}: {children: React.ReactNode}) => {
    const cookieAccessToken = getCookie("token")

    const [accessToken, setAccessToken] = useState<string | null>(
        () => cookieAccessToken ?? null
    );

    const [role, setRoleId] = useState<string | null>(
        readRoleFromToken(cookieAccessToken ?? null)
    );

    const roleRef = useRef<string | null>(readRoleFromToken(cookieAccessToken ?? null));

    const loginUser = async (fields: LoginFields) => {
        const res = await login(fields);
        setCookie("token", res.token, {
            expires: 1,
            SameSite: "Lax",
            secure: false,
            path: "/",
        });
        setAccessToken(res.token);
        setRoleId(readRoleFromToken(res.token));
        roleRef.current = readRoleFromToken(res.token);
    }

    const logoutUser = () => {
        deleteCookie("token");
        setAccessToken(null);
        setRoleId(null);
    }

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: !!accessToken,
                accessToken,
                role,
                roleRef,
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