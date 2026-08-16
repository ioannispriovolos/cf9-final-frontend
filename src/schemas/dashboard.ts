import { z } from "zod";

/**
 * Defines the structure of a generic dashboard count entry.
 *
 * This schema is used for grouped device statistics where a descriptive
 * label is associated with a non-negative numeric count.
 *
 * Examples include the number of devices grouped by manufacturer or
 * by device model.
 */
export const dashboardCountSchema = z.object({
    label: z.string().trim().min(1),
    count: z.number().int().nonnegative(),
});

/**
 * Defines the structure of a monthly device-count entry.
 *
 * This schema represents the number of devices registered during a
 * particular month and is used for time-based dashboard statistics.
 */
export const monthlyDeviceCountSchema = z.object({
    month: z.string().trim().min(1),
    count: z.number().int().nonnegative(),
});

/**
 * Defines the structure of a recently created device displayed
 * in the dashboard.
 *
 * The schema validates the identifying and network-related information
 * returned by the backend for devices included in the recent-device
 * statistics.
 */
export const recentDeviceSchema = z.object({
    id: z.number().int().positive(),
    title: z.string().trim().min(1),
    manufacturer: z.string().trim().min(1),
    model: z.string().trim().min(1),
    ipAddress: z.string().trim().min(1),
    sshPort: z.number().int().min(1).max(65535),
    updatedAt: z.iso.datetime(),
});

/**
 * Defines the complete structure of the viewer dashboard response
 * returned by the backend.
 *
 * The schema validates both the high-level summary metrics and the
 * collections used to present grouped, historical, and recent-device
 * statistics.
 *
 * Validating the backend response at the API boundary ensures that
 * dashboard components receive data matching the structure expected
 * by the frontend.
 */
export const viewerDashboardResponseSchema = z.object({
    activeDevices: z.number().int().nonnegative(),
    totalManufacturers: z.number().int().nonnegative(),
    totalModels: z.number().int().nonnegative(),
    devicesAddedThisMonth: z.number().int().nonnegative(),
    devicesByManufacturer: z.array(dashboardCountSchema),
    devicesByModel: z.array(dashboardCountSchema),
    devicesAddedByMonth: z.array(monthlyDeviceCountSchema),
    recentlyCreatedDevices: z.array(recentDeviceSchema),
});

/**
 * Represents a validated viewer dashboard response.
 *
 * The TypeScript type is inferred directly from
 * `viewerDashboardResponseSchema`, keeping the compile-time type definition
 * synchronized with the runtime Zod validation rules.
 */
export type ViewerDashboardResponse = z.infer<typeof viewerDashboardResponseSchema>;