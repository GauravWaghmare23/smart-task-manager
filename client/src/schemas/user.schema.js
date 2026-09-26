import {z} from "zod";

export const UserSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),

  email: z
    .string()
    .min(1, "Email is required")
    .pipe(
      z.email({
        error: "Please enter a valid email",
      })
    ),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),

  role: z.enum(["USER", "ADMIN"], {
    error: "Please select a role",
  }),
});