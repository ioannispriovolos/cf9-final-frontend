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

export const createDeviceSchema = z.object({
    title: z.string().trim().min(2).max(100),
    manufacturer: z.string().trim().min(1).max(100),
    model: z.string().trim().min(1).max(100),
    ipAddress: z.string().trim().min(1),
    sshPort: z.coerce.number().int().min(1).max(65535),
    username: z.string().trim().min(1).max(100),
    password: z.string().min(1).max(255),
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