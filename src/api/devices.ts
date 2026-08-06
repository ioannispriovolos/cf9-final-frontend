import {
    type CreateDevicePayload,
    createDeviceSchema,
    type Device,
    deviceSchema,
    type ExecuteCommandPayload,
    executeCommandSchema,
    type ExecuteCommandResponse,
    executeCommandResponseSchema, type DevicePage, devicePageSchema, type UpdateDevicePayload,
    updateDevicePayloadSchema,
} from "@/schemas/devices";
import {API_URL, getAuthorizationHeaders, getErrorMessage} from "@/api/config.ts";



/**
 * Retrieve all active devices.
 */
export async function getDevices(
    page: number = 0,
    size: number = 6,
): Promise<DevicePage> {
    const response = await fetch(
        `${API_URL}/devices?page=${page}&size=${size}&sort=title,asc`,
        {
            method: "GET",
            headers: getAuthorizationHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to retrieve devices.",
            )
        );
    }

    const data: unknown = await response.json();

    return devicePageSchema.parse(data);
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

/**
 * Partially updates a device.
 *
 * Unmodified fields are represented by null.
 * Password cannot be updated by this operation.
 */
export async function updateDevice(
    id: number,
    payload: UpdateDevicePayload
): Promise<Device> {
    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        throw new Error(
            "A valid device ID is required."
        );
    }

    const validatedPayload =
        updateDevicePayloadSchema.parse(
            payload
        );

    const response = await fetch(
        `${API_URL}/devices/${id}`,
        {
            method: "PUT",
            headers:
                getAuthorizationHeaders(),
            body: JSON.stringify(
                validatedPayload
            ),
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to update device."
            )
        );
    }

    const data: unknown =
        await response.json();

    return deviceSchema.parse(data);
}