import { z } from "zod";

export const deviceSchema = z.object({
    id: z.number().int().positive(),
    title: z.string(),
    manufacturer: z.string(),
    model: z.string(),
    ipAddress: z.string(),
    sshPort: z.number().int(),
    username: z.string(),
});

export type Device = z.infer<typeof deviceSchema>;

export const devicePageSchema = z.object({
    content: z.array(deviceSchema),
    page: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    first: z.boolean(),
    last: z.boolean(),
});

export type DevicePage = z.infer<typeof devicePageSchema>;

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
            /^(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})(?:\.(?!$)|$)){4}$/,
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

export type CreateDeviceFormInput = z.input<
    typeof createDeviceSchema
>;

export type CreateDevicePayload = z.output<
    typeof createDeviceSchema
>;

export const executeCommandSchema = z.object({
    command: z.string().trim().min(1).max(2000),
    deviceIds: z
        .array(z.number().int().positive())
        .min(1, "Select at least one device"),
});

export type ExecuteCommandPayload = z.infer<
    typeof executeCommandSchema
>;

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

export type SshExecutionResult = z.infer<
    typeof sshExecutionResultSchema
>;

export const executeCommandResponseSchema = z.object({
    requestedDevices: z.number().int().nonnegative(),

    successfulDevices: z.number().int().nonnegative(),

    failedDevices: z.number().int().nonnegative(),

    durationMs: z.number().nonnegative(),

    results: z.array(sshExecutionResultSchema),
});

export type ExecuteCommandResponse = z.infer<
    typeof executeCommandResponseSchema
>;