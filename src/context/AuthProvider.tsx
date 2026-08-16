import type {LoginFields} from "src/schemas/auth.ts";
import {createContext, useContext, useRef, useState} from "react";
import {jwtDecode} from "jwt-decode";
import {deleteCookie, getCookie, setCookie} from "src/utils/cookies.ts";
import {login} from "src/api/auth.ts";
import * as React from "react";

/**
 * Defines the values and authentication operations exposed through
 * the application's authentication context.
 *
 * Components consuming this context can determine the current authentication
 * state, access the JWT token and user role, and perform login or logout
 * operations.
 */
type AuthContextProps = {
    isAuthenticated: boolean;
    accessToken: string | null;
    role: string | null;
    /**
     * Synchronous reference to the current authenticated user's role.
     *
     * The ref allows consumers such as route guards to access the latest role
     * value immediately without depending on a React state update cycle.
     */
    roleRef: React.RefObject<string | null>;
    loginUser: (fields: LoginFields) => Promise<void>;
    logoutUser: () => void;
}

/**
 * Represents the portion of the JWT payload required by the frontend.
 *
 * Only the role claim is currently consumed by the authentication context.
 */
type JwtPayload = {
    role: string;
}

/**
 * React context containing the application's authentication state
 * and authentication-related operations.
 *
 * The initial value is undefined so that `useAuth()` can detect attempts
 * to consume the context outside an `AuthProvider`.
 */
const AuthContext = createContext<AuthContextProps | undefined>(undefined)

/**
 * Extracts the user's role from a JWT access token.
 *
 * If no token is supplied, or if JWT decoding fails, the function safely
 * returns null rather than propagating the decoding error.
 *
 * Decoding the token on the frontend is used to determine UI and routing
 * behavior. Backend authorization must still independently validate the
 * token and enforce access-control rules.
 *
 * @param token - JWT access token from which the role should be extracted.
 *
 * @returns The role contained in the JWT payload, or null when the token
 * is missing, invalid, or does not contain a role.
 */
function readRoleFromToken(token: string | null): string | null {
    if (!token) return null;
    try {
        return jwtDecode<JwtPayload>(token).role ?? null;
    } catch {
        return null;
    }
}

/**
 * Provides authentication state and operations to descendant components.
 *
 * When the provider is initialized, it attempts to restore the existing
 * authentication token from the application's cookies. If a token exists,
 * the access token and role state are initialized from that stored session.
 *
 * The provider exposes:
 * - the current authentication status;
 * - the JWT access token;
 * - the role extracted from the JWT;
 * - a synchronous role reference;
 * - the login operation;
 * - the logout operation.
 *
 * @param children - React components that should have access to the
 * authentication context.
 *
 * @returns An `AuthContext.Provider` wrapping the supplied child components.
 */
export const AuthProvider = ({children}: {children: React.ReactNode}) => {
    const cookieAccessToken = getCookie("token")

    const [accessToken, setAccessToken] = useState<string | null>(
        () => cookieAccessToken ?? null
    );

    const [role, setRoleId] = useState<string | null>(
        readRoleFromToken(cookieAccessToken ?? null)
    );

    /**
     * Maintains a synchronous reference to the current role.
     *
     * This complements React state for consumers that require immediate
     * access to the latest role value, such as route guards.
     */
    const roleRef = useRef<string | null>(readRoleFromToken(cookieAccessToken ?? null));

    /**
     * Authenticates a user and establishes the frontend session.
     *
     * The supplied credentials are sent through the authentication API.
     * After successful authentication, the returned JWT is stored in a
     * cookie and synchronized with both the access-token state and role state.
     * The role reference is also updated immediately.
     *
     * @param fields - Login credentials supplied by the user.
     *
     * @returns A Promise that resolves when authentication has completed
     * successfully.
     *
     * @throws {Error} Propagates authentication errors produced by the
     * underlying login API operation.
     */
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

    /**
     * Terminates the current frontend authentication session.
     *
     * The stored JWT cookie is removed and all authentication-related
     * React state and role references are cleared.
     */
    const logoutUser = () => {
        deleteCookie("token");
        setAccessToken(null);
        setRoleId(null);
        roleRef.current = null;
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

/**
 * Provides convenient access to the application's authentication context.
 *
 * The hook ensures that authentication state can only be consumed by
 * components rendered within an `AuthProvider`.
 *
 * @returns The current authentication context containing session state,
 * role information, and login/logout operations.
 *
 * @throws {Error} Throws an error when the hook is called outside an
 * `AuthProvider`.
 */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}