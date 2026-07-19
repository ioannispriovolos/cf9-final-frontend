import {z} from "zod";

export const userSchema = z.object({
    uuid: z.uuid({ message: "Invalid canonical UUID format" }),
    username: z.string().min(1, { message: "Username cannot be empty" }),
    role: z.enum(["ADMIN", "NETWORK_ENGINEER", "VIEWER"]),
});

export type User = z.infer<typeof userSchema>;