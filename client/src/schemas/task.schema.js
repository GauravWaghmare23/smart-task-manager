import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less"),

  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),

  priority: z.enum(["LOW", "MEDIUM", "HIGH"], {
    error: "Please select a priority",
  }),

  assignedTo: z.string().min(1, "Please assign the task to a user"),

  dependencies: z.array(z.string()),
});
