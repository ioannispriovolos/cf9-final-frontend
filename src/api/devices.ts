import { z } from "zod";
import { getCookie } from "@/utils/cookies";

import {
    type CreateDevicePayload,
    createDeviceSchema,
    type Device,
    deviceSchema,
    type ExecuteCommandPayload,
    executeCommandSchema,
    type ExecuteCommandResponse,
    executeCommandResponseSchema,
} from "@/schemas/devices";

const API_URL = import.meta.env.VITE_API_URL;

function getAuthorizationHeaders(): HeadersInit {
    const token = getCookie("token");

    if (!token) {
        throw new Error("Authentication token not found.");
    }

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

async function getErrorMessage(
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

/**
 * Retrieve all active devices.
 */
export async function getDevices(): Promise<Device[]> {
    const response = await fetch(`${API_URL}/devices`, {
        method: "GET",
        headers: getAuthorizationHeaders(),
    });

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to retrieve devices",
            ),
        );
    }

    const data: unknown = await response.json();

    return z.array(deviceSchema).parse(data);
}

/**
 * Register a new network device.
 */
export async function createDevice(
    payload: CreateDevicePayload,
): Promise<Device> {
    const validatedPayload = createDeviceSchema.parse(payload);

    const response = await fetch(`${API_URL}/devices`, {
        method: "POST",
        headers: getAuthorizationHeaders(),
        body: JSON.stringify(validatedPayload),
    });

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to register device",
            ),
        );
    }

    const data: unknown = await response.json();

    return deviceSchema.parse(data);
}

/**
 * Soft-delete a network device.
 */
export async function deleteDevice(id: number): Promise<void> {
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("A valid device ID is required.");
    }

    const response = await fetch(`${API_URL}/devices/${id}`, {
        method: "PATCH",
        headers: getAuthorizationHeaders(),
    });

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to delete device",
            ),
        );
    }
}

/**
 * Execute an SSH command against one or more devices.
 */
export async function executeCommand(
    payload: ExecuteCommandPayload,
): Promise<ExecuteCommandResponse> {
    const validatedPayload = executeCommandSchema.parse(payload);

    const response = await fetch(`${API_URL}/ssh/execute`, {
        method: "POST",
        headers: getAuthorizationHeaders(),
        body: JSON.stringify(validatedPayload),
    });

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "SSH command execution failed",
            ),
        );
    }

    const data: unknown = await response.json();

    return executeCommandResponseSchema.parse(data);
}