import { z } from "zod";

export const dashboardCountSchema = z.object({
    label: z.string().trim().min(1),

    count: z.number().int().nonnegative(),
});

export const monthlyDeviceCountSchema = z.object({
    month: z.string().trim().min(1),

    count: z.number().int().nonnegative(),
});

export const recentDeviceSchema = z.object({
    id: z.number().int().positive(),

    title: z.string().trim().min(1),

    manufacturer: z.string().trim().min(1),

    model: z.string().trim().min(1),

    ipAddress: z.string().trim().min(1),

    sshPort: z.number().int().min(1).max(65535),

    updatedAt: z.iso.datetime(),
});

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

export type ViewerDashboardResponse = z.infer<typeof viewerDashboardResponseSchema>;