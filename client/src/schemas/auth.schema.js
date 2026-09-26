import {z} from "zod";

export const loginSchema = z.object({
    email:z.string().min(1,"Email is required.").pipe(z.email({error:"Please enter a valid email"})),
    password:z.string().min(1,"Password is required")
});

