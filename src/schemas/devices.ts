import { z } from "zod";

/**
 * Regular expression used to validate IPv4 addresses.
 *
 * The expression accepts four decimal octets separated by periods,
 * with each octet restricted to the valid IPv4 range of 0 through 255.
 */
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})(?:\.(?!$)|$)){4}$/;

/**
 * Defines the structure of a network device returned by the backend.
 *
 * The schema validates the core device information exposed to the frontend,
 * including identification, descriptive information, network addressing,
 * and SSH connection properties.
 *
 * Sensitive information such as the device password is intentionally not
 * included in the response schema.
 */
export const deviceSchema = z.object({
    id: z.number().int().positive(),
    title: z.string(),
    manufacturer: z.string(),
    model: z.string(),
    ipAddress: z.string(),
    sshPort: z.number().int(),
    username: z.string(),
});

/**
 * Represents a validated network device.
 *
 * The TypeScript type is inferred directly from `deviceSchema`, keeping the
 * compile-time representation synchronized with runtime validation.
 */
export type Device = z.infer<typeof deviceSchema>;

/**
 * Defines the structure of a paginated device response returned by
 * the backend.
 *
 * In addition to the devices belonging to the requested page, the response
 * contains pagination metadata used by the frontend Device Directory and
 * SSH target-selection interfaces.
 */
export const devicePageSchema = z.object({
    content: z.array(deviceSchema),
    page: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    first: z.boolean(),
    last: z.boolean(),
});

/**
 * Represents a validated paginated device response.
 */
export type DevicePage = z.infer<typeof devicePageSchema>;

/**
 * Defines the validation rules for registering a new network device.
 *
 * The schema validates descriptive device information, IPv4 addressing,
 * SSH connection settings, and device credentials before a creation request
 * is sent to the backend.
 *
 * String values are trimmed where appropriate and the SSH port is coerced
 * from form input into a number before validation.
 */
export const createDeviceSchema = z.object({
    title: z.string().trim()
        .min(2, {
            message: "Title must contain at least 2 characters.",
        })
        .max(150, {
            message: "Title must not exceed 150 characters.",
        }),

    manufacturer: z.string().trim()
        .min(1, {
            message: "Manufacturer is required.",
        })
        .max(100, {
            message: "Manufacturer must not exceed 100 characters.",
        }),

    model: z.string().trim()
        .min(1, {
            message: "Model is required.",
        })
        .max(100, {
            message: "Model must not exceed 100 characters.",
        }),

    ipAddress: z.string().trim()
        .min(1, {
            message: "IP address is required.",
        })
        .regex(
            ipv4Regex,
            {
                message: "Must be a valid IPv4 address.",
            }
        ),

    sshPort: z.coerce
        .number({
            message: "SSH port must be a number.",
        })
        .int({
            message: "SSH port must be a whole number.",
        })
        .min(1, {
            message: "SSH port must be at least 1.",
        })
        .max(65535, {
            message: "SSH port must not exceed 65535.",
        }),

    username: z.string().trim()
        .min(1, {
            message: "SSH username is required.",
        })
        .max(100, {
            message: "SSH username must not exceed 100 characters.",
        }),

    password: z
        .string()
        .min(1, {
            message: "SSH password is required.",
        })
        .max(255, {
            message: "SSH password must not exceed 255 characters.",
        }),
});

/**
 * Represents the raw input accepted by the create-device form.
 *
 * This type is derived from the input side of `createDeviceSchema`.
 * It is useful because fields such as `sshPort` may initially originate
 * from HTML form controls before Zod coercion is applied.
 */
export type CreateDeviceFormInput = z.input<
    typeof createDeviceSchema
>;

/**
 * Represents a fully validated and transformed device-creation payload.
 *
 * This is the output produced after `createDeviceSchema` has completed
 * validation and transformations such as numeric SSH port coercion.
 */
export type CreateDevicePayload = z.output<
    typeof createDeviceSchema
>;

/**
 * Defines the request structure for executing an SSH command.
 *
 * A command must contain at least one non-whitespace character and cannot
 * exceed 2000 characters. At least one valid device ID must be selected
 * as an execution target.
 */
export const executeCommandSchema = z.object({
    command: z.string().trim().min(1).max(2000),
    deviceIds: z
        .array(z.number().int().positive())
        .min(1, "Select at least one device"),
});

/**
 * Represents a validated SSH command-execution request.
 */
export type ExecuteCommandPayload = z.infer<
    typeof executeCommandSchema
>;

/**
 * Defines the result of SSH command execution for a single device.
 *
 * The result records the target device, whether execution succeeded,
 * process status information, standard and error output, an optional
 * failure message, and the duration of the operation.
 */
export const sshExecutionResultSchema = z.object({
    deviceId: z.number().int().positive(),

    deviceTitle: z.string(),

    ipAddress: z.string(),

    successful: z.boolean(),

    exitStatus: z.number().int().nullable(),

    output: z.string(),

    errorOutput: z.string(),

    errorMessage: z.string().nullable(),

    durationMs: z.number().nonnegative(),
});

/**
 * Represents a validated SSH execution result for a single device.
 */
export type SshExecutionResult = z.infer<
    typeof sshExecutionResultSchema
>;

/**
 * Defines the complete response returned after batch SSH command execution.
 *
 * The response provides aggregate execution statistics together with
 * the individual result produced for each target device.
 */
export const executeCommandResponseSchema = z.object({
    requestedDevices: z.number().int().nonnegative(),

    successfulDevices: z.number().int().nonnegative(),

    failedDevices: z.number().int().nonnegative(),

    durationMs: z.number().nonnegative(),

    results: z.array(sshExecutionResultSchema),
});

/**
 * Represents a validated batch SSH command-execution response.
 */
export type ExecuteCommandResponse = z.infer<
    typeof executeCommandResponseSchema
>;

/**
 * Defines the validation rules for values entered while editing
 * an existing device.
 *
 * The edit form is initially populated with the device's current values.
 * All editable properties are therefore represented as complete values
 * while the user is modifying the row.
 *
 * Password is intentionally excluded because device credentials cannot
 * be modified through this update workflow.
 */
export const updateDeviceFormSchema = z.object({
    title: z.string().trim()
        .min(2, {
            message: "Title must contain at least 2 characters.",
        })
        .max(150, {
            message: "Title must not exceed 150 characters.",
        }),

    manufacturer: z.string().trim()
        .min(1, {
            message: "Manufacturer is required.",
        })
        .max(100, {
            message: "Manufacturer must not exceed 100 characters.",
        }),

    model: z.string().trim()
        .min(1, {
            message: "Model is required.",
        })
        .max(100, {
            message: "Model must not exceed 100 characters.",
        }),

    ipAddress: z.string().trim()
        .min(1, {
            message: "IP address is required.",
        })
        .regex(
            ipv4Regex,
            {
                message: "Must be a valid IPv4 address.",
            }
        ),

    sshPort: z.coerce
        .number({
            message: "SSH port must be a number.",
        })
        .int({
            message: "SSH port must be a whole number.",
        })
        .min(1, {
            message: "SSH port must be at least 1.",
        })
        .max(65535, {
            message: "SSH port must not exceed 65535.",
        }),

    username: z.string().trim()
        .min(1, {
            message: "SSH username is required.",
        })
        .max(100, {
            message: "SSH username must not exceed 100 characters.",
        }),
});

/**
 * Represents the raw values accepted by the device-edit form before
 * Zod transformations are applied.
 */
export type UpdateDeviceFormInput = z.input<
    typeof updateDeviceFormSchema
>;

/**
 * Represents the validated and transformed values produced by the
 * device-edit form.
 */
export type UpdateDeviceFormValues = z.output<
    typeof updateDeviceFormSchema
>;

/**
 * Defines the partial device-update payload sent to the backend.
 *
 * Every editable property is nullable. A null value represents a field that
 * was not modified by the user and should therefore retain its existing value
 * on the backend.
 *
 * Password is intentionally excluded from the schema because device
 * credentials cannot be changed through this operation.
 *
 * The payload must contain at least one non-null property, preventing an
 * update request from being submitted when no device values have changed.
 */
export const updateDevicePayloadSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(2)
            .max(150)
            .nullable(),

        manufacturer: z
            .string()
            .trim()
            .min(1)
            .max(100)
            .nullable(),

        model: z
            .string()
            .trim()
            .min(1)
            .max(100)
            .nullable(),

        ipAddress: z
            .string()
            .trim()
            .regex(ipv4Regex, {
                message:
                    "Must be a valid IPv4 address.",
            })
            .nullable(),

        sshPort: z
            .number()
            .int()
            .min(1)
            .max(65535)
            .nullable(),

        username: z
            .string()
            .trim()
            .min(1)
            .max(100)
            .nullable(),
    })
    .refine(
        (payload) =>
            Object.values(payload).some(
                (value) => value !== null
            ),
        {
            message:
                "At least one device property must be modified.",
        }
    );

/**
 * Represents the validated partial device-update payload sent
 * to the backend.
 *
 * Each property may be null when unchanged, but the schema guarantees
 * that at least one property contains a modified value.
 */
export type UpdateDevicePayload = z.infer<
    typeof updateDevicePayloadSchema
>;