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
 * Retrieves a paginated collection of active network devices from the backend.
 *
 * The function sends an authenticated GET request to the device endpoint using
 * the requested page number and page size. Devices are requested in ascending
 * alphabetical order by title.
 *
 * The backend response is parsed as JSON and validated against
 * `devicePageSchema` before being returned. This ensures that the received
 * pagination metadata and device records match the structure expected by
 * the frontend.
 *
 * @param page - Zero-based page index to retrieve. Defaults to `0`.
 * @param size - Maximum number of devices to retrieve per page. Defaults to `6`.
 *
 * @returns A Promise that resolves to a validated `DevicePage` containing
 * the requested devices and pagination information.
 *
 * @throws {Error} Throws an error if the backend request is unsuccessful.
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

    // Treat the external API response as unknown until it has
    // been validated against the expected Zod schema.
    const data: unknown = await response.json();

    return devicePageSchema.parse(data);
}

/**
 * Registers a new network device in the backend.
 *
 * Before the request is sent, the supplied device data is validated against
 * `createDeviceSchema`. This prevents malformed device data from being sent
 * to the backend.
 *
 * The validated payload is serialized as JSON and submitted through an
 * authenticated POST request. The created device returned by the backend
 * is then validated against `deviceSchema`.
 *
 * @param payload - The network device information required to create
 * a new device.
 *
 * @returns A Promise that resolves to the validated `Device` created
 * by the backend.
 *
 * @throws {Error} Throws an error if the backend rejects the request.
 */
export async function createDevice(
    payload: CreateDevicePayload,
): Promise<Device> {
    // Validate the outgoing device data before sending it to the backend.
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

    // Validate the created device returned by the backend.
    const data: unknown = await response.json();

    return deviceSchema.parse(data);
}

/**
 * Soft-deletes a network device identified by its numeric ID.
 *
 * The function first verifies that the supplied ID is a positive integer.
 * It then sends an authenticated PATCH request to the corresponding backend
 * device endpoint.
 *
 * This operation performs a soft deletion rather than physically removing
 * the device record from the database. The exact persistence behavior is
 * handled by the backend.
 *
 * @param id - The unique numeric identifier of the device to soft-delete.
 *
 * @returns A Promise that resolves when the soft-delete operation completes
 * successfully.
 *
 * @throws {Error} Throws an error if the device ID is invalid or if the
 * backend rejects the deletion request.
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
 * Executes an SSH command against one or more selected network devices.
 *
 * The command and target device identifiers are validated against
 * `executeCommandSchema` before being sent to the backend.
 *
 * The validated request is submitted to the SSH execution endpoint using
 * an authenticated POST request. The backend is responsible for establishing
 * the SSH connections, executing the command, and collecting the result for
 * each selected device.
 *
 * The returned batch execution response is validated against
 * `executeCommandResponseSchema` before being exposed to the frontend.
 *
 * @param payload - The SSH command and collection of target device IDs.
 *
 * @returns A Promise that resolves to a validated
 * `ExecuteCommandResponse` containing the batch execution results.
 *
 * @throws {Error} Throws an error if the backend request is unsuccessful.
 */
export async function executeCommand(
    payload: ExecuteCommandPayload,
): Promise<ExecuteCommandResponse> {
    // Validate the command and selected device IDs before execution.
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

    // Validate the batch SSH result returned by the backend.
    return executeCommandResponseSchema.parse(data);
}

/**
 * Partially updates an existing network device.
 *
 * The function validates the device ID and the update payload before sending
 * an authenticated PUT request to the backend.
 *
 * Fields that have not been modified are represented by `null`, allowing the
 * backend to preserve their existing values. Device passwords cannot be
 * changed through this operation.
 *
 * The backend response is parsed and validated against `deviceSchema` before
 * the updated device is returned to the frontend.
 *
 * @param id - The unique numeric identifier of the device to update.
 * @param payload - The device properties to update. Unmodified properties
 * are represented by `null`.
 *
 * @returns A Promise that resolves to the validated updated `Device`.
 *
 * @throws {Error} Throws an error if the device ID is invalid or if the
 * backend rejects the update request.
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

    // Validate the partial update before sending it to the backend.
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